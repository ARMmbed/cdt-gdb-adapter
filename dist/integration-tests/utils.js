"use strict";
/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const debugClient_1 = require("./debugClient");
function getScopes(dc, threadIndex = 0, stackIndex = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        // threads
        const threads = yield dc.threadsRequest();
        chai_1.expect(threads.body.threads.length, 'There are fewer threads than expected.').to.be.at.least(threadIndex + 1);
        const threadId = threads.body.threads[threadIndex].id;
        // stack trace
        const stack = yield dc.stackTraceRequest({ threadId });
        chai_1.expect(stack.body.stackFrames.length, 'There are fewer stack frames than expected.').to.be.at.least(stackIndex + 1);
        const frameId = stack.body.stackFrames[stackIndex].id;
        const scopes = yield dc.scopesRequest({ frameId });
        return Promise.resolve({ threadId, frameId, scopes });
    });
}
exports.getScopes = getScopes;
/**
 * Wrap `promise` in a new Promise that resolves if `promise` is rejected, and is rejected if `promise` is resolved.
 *
 * This is useful when we expect `promise` to be reject and want to test that it is indeed the case.
 */
function expectRejection(promise) {
    return new Promise((resolve, reject) => {
        promise.then(reject).catch(resolve);
    });
}
exports.expectRejection = expectRejection;
/**
 * Test a given variable returned from a variablesRequest against an expected name, type, and/or value.
 */
function verifyVariable(variable, expectedName, expectedType, expectedValue, hasChildren = false) {
    chai_1.expect(variable.name, `The name of ${expectedName} is wrong`).to.equal(expectedName);
    if (expectedType) {
        chai_1.expect(variable.type, `The type of ${expectedName} is wrong`).to.equal(expectedType);
    }
    if (expectedValue) {
        chai_1.expect(variable.value, `The value of ${expectedName} is wrong`).to.equal(expectedValue);
    }
    if (hasChildren) {
        chai_1.expect(variable.variablesReference, `${expectedName} has no children`).to.not.equal(0);
    }
    else {
        chai_1.expect(variable.variablesReference, `${expectedName} has children`).to.equal(0);
    }
}
exports.verifyVariable = verifyVariable;
function compareVariable(varA, varB, namesMatch, typesMatch, valuesMatch) {
    if (namesMatch) {
        chai_1.expect(varA.name, `The name of ${varA.name} and ${varB.name} does not match`).to.equal(varB.name);
    }
    else {
        chai_1.expect(varA.name, `The name of ${varA.name} and ${varB.name} matches`).to.not.equal(varB.name);
    }
    if (typesMatch) {
        chai_1.expect(varA.type, `The type of ${varA.name} and ${varB.name} does not match`).to.equal(varB.type);
    }
    else {
        chai_1.expect(varA.type, `The type of ${varA.name} and ${varB.name} match`).to.equal(varB.type);
    }
    if (valuesMatch) {
        chai_1.expect(varA.value, `The value of ${varA.name} and ${varB.name} do not match`).to.equal(varB.value);
    }
    else {
        chai_1.expect(varA.value, `The value of ${varA.name} and ${varB.name} matches`).to.not.equal(varB.value);
    }
}
exports.compareVariable = compareVariable;
exports.testProgramsDir = path.join(__dirname, '..', '..', 'src', 'integration-tests', 'test-programs');
// Run make once per mocha execution by having root-level before
before(function (done) {
    this.timeout(20000);
    cp.execSync('make', { cwd: exports.testProgramsDir });
    done();
});
function getAdapterAndArgs(adapter) {
    const chosenAdapter = adapter !== undefined ? adapter : exports.defaultAdapter;
    let args = path.join(__dirname, '../../dist', chosenAdapter);
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        args = '--inspect-brk ' + args;
    }
    return args;
}
function standardBeforeEach(adapter) {
    return __awaiter(this, void 0, void 0, function* () {
        const dc = new debugClient_1.CdtDebugClient('node', getAdapterAndArgs(adapter), 'cppdbg', {
            shell: true,
        });
        yield dc.start(exports.debugServerPort);
        yield dc.initializeRequest();
        return dc;
    });
}
exports.standardBeforeEach = standardBeforeEach;
exports.openGdbConsole = process.argv.indexOf('--run-in-terminal') !== -1;
exports.gdbPath = getGdbPathCli();
exports.gdbServerPath = getGdbServerPathCli();
exports.debugServerPort = getDebugServerPortCli();
exports.defaultAdapter = getDefaultAdapterCli();
function getGdbPathCli() {
    const keyIndex = process.argv.indexOf('--gdb-path');
    if (keyIndex === -1) {
        return undefined;
    }
    return process.argv[keyIndex + 1];
}
function getGdbServerPathCli() {
    const keyIndex = process.argv.indexOf('--gdbserver-path');
    if (keyIndex === -1) {
        return 'gdbserver';
    }
    return process.argv[keyIndex + 1];
}
function getDebugServerPortCli() {
    const keyIndex = process.argv.indexOf('--debugserverport');
    if (keyIndex === -1) {
        return undefined;
    }
    return parseInt(process.argv[keyIndex + 1], 10);
}
function getDefaultAdapterCli() {
    const keyIndex = process.argv.indexOf('--test-remote');
    if (keyIndex === -1) {
        return 'debugAdapter.js';
    }
    return 'debugTargetAdapter.js';
}
/**
 * Find locations of tags in `sourceFile`.
 *
 * Instead of referring to source line numbers of test programs directly,
 * tests should place tags (usually some comments) in the source files.  This
 * function finds the line number correspnding to each tag in `tags`.
 *
 * This function throws if a tag is found more than once or is not found.
 *
 * @param tags An object where keys are the tags to find, and values are 0.
 *             This function will modify the object in place to full the values
 *             with line number.
 */
function resolveLineTagLocations(sourceFile, tags) {
    const lines = fs.readFileSync(sourceFile, { encoding: 'utf-8' }).split('\n');
    for (let i = 0; i < lines.length; i++) {
        for (const tag of Object.keys(tags)) {
            if (lines[i].includes(tag)) {
                if (tags[tag] !== 0) {
                    throw new Error(`Tag ${tag} has been found twice.`);
                }
                tags[tag] = i + 1;
            }
        }
    }
    for (const tag of Object.keys(tags)) {
        const line = tags[tag];
        if (line === 0) {
            throw new Error(`Tag ${tag} was not found.`);
        }
    }
}
exports.resolveLineTagLocations = resolveLineTagLocations;
//# sourceMappingURL=utils.js.map