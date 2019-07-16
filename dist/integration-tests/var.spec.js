"use strict";
/*********************************************************************
 * Copyright (c) 2018 QNX Software Systems and others
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
const path = require("path");
const utils_1 = require("./utils");
// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions
let dc;
let scope;
const varsProgram = path.join(utils_1.testProgramsDir, 'vars');
const varsSrc = path.join(utils_1.testProgramsDir, 'vars.c');
const numVars = 8; // number of variables in the main() scope of vars.c
const lineTags = {
    'STOP HERE': 0,
};
const hexValueRegex = /0x[\d]+/;
before(function () {
    utils_1.standardBefore();
    utils_1.resolveLineTagLocations(varsSrc, lineTags);
});
beforeEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        dc = yield utils_1.standardBeforeEach();
        yield dc.hitBreakpoint({
            verbose: true,
            gdb: utils_1.gdbPath,
            program: varsProgram,
            openGdbConsole: utils_1.openGdbConsole,
        }, {
            path: varsSrc,
            line: lineTags['STOP HERE'],
        });
        scope = yield utils_1.getScopes(dc);
        chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
    });
});
afterEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield dc.stop();
    });
});
describe('Variables Test Suite', function () {
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('can read and set simple variables in a program', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // read the variables
            const vr = scope.scopes.body.scopes[0].variablesReference;
            let vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[0], 'a', 'int', '1');
            utils_1.verifyVariable(vars.body.variables[1], 'b', 'int', '2');
            // set the variables to something different
            yield dc.setVariableRequest({ name: 'a', value: '25', variablesReference: vr });
            yield dc.setVariableRequest({ name: 'b', value: '10', variablesReference: vr });
            // assert that the variables have been updated to the new values
            vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[0], 'a', 'int', '25');
            utils_1.verifyVariable(vars.body.variables[1], 'b', 'int', '10');
            // step the program and see that the values were passed to the program and evaluated.
            yield dc.nextRequest({ threadId: scope.threadId });
            vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[2], 'c', 'int', '35');
        });
    });
    it('can read and set struct variables in a program', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // step past the initialization for the structure
            yield dc.nextRequest({ threadId: scope.threadId });
            yield dc.nextRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            // assert we can see the struct and its elements
            let vr = scope.scopes.body.scopes[0].variablesReference;
            let vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[3], 'r', 'struct foo', '{...}', true);
            const childVR = vars.body.variables[3].variablesReference;
            let children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], 'x', 'int', '1');
            utils_1.verifyVariable(children.body.variables[1], 'y', 'int', '2');
            utils_1.verifyVariable(children.body.variables[2], 'z', 'struct bar', '{...}', true);
            // set the variables to something different
            yield dc.setVariableRequest({ name: 'x', value: '25', variablesReference: childVR });
            yield dc.setVariableRequest({ name: 'y', value: '10', variablesReference: childVR });
            // assert that the variables have been updated to the new values
            children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], 'x', 'int', '25');
            utils_1.verifyVariable(children.body.variables[1], 'y', 'int', '10');
            // step the program and see that the values were passed to the program and evaluated.
            yield dc.nextRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            vr = scope.scopes.body.scopes[0].variablesReference;
            vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[4], 'd', 'int', '35');
        });
    });
    it('can read and set nested struct variables in a program', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // step past the initialization for the structure
            yield dc.nextRequest({ threadId: scope.threadId });
            yield dc.nextRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            // assert we can see the 'foo' struct and its child 'bar' struct
            let vr = scope.scopes.body.scopes[0].variablesReference;
            let vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[3], 'r', 'struct foo', '{...}', true);
            const childVR = vars.body.variables[3].variablesReference;
            const children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[2], 'z', 'struct bar', '{...}', true);
            // assert we can see the elements of z
            const subChildVR = children.body.variables[2].variablesReference;
            let subChildren = yield dc.variablesRequest({ variablesReference: subChildVR });
            chai_1.expect(subChildren.body.variables.length, 'There is a different number of grandchild variables than expected').to.equal(2);
            utils_1.verifyVariable(subChildren.body.variables[0], 'a', 'int', '3');
            utils_1.verifyVariable(subChildren.body.variables[1], 'b', 'int', '4');
            // set the variables to something different
            yield dc.setVariableRequest({ name: 'a', value: '25', variablesReference: subChildVR });
            yield dc.setVariableRequest({ name: 'b', value: '10', variablesReference: subChildVR });
            // assert that the variables have been updated to the new values
            subChildren = yield dc.variablesRequest({ variablesReference: subChildVR });
            chai_1.expect(subChildren.body.variables.length, 'There is a different number of grandchild variables than expected').to.equal(2);
            utils_1.verifyVariable(subChildren.body.variables[0], 'a', 'int', '25');
            utils_1.verifyVariable(subChildren.body.variables[1], 'b', 'int', '10');
            // step the program and see that the values were passed to the program and evaluated.
            yield dc.nextRequest({ threadId: scope.threadId });
            yield dc.nextRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            vr = scope.scopes.body.scopes[0].variablesReference;
            vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[5], 'e', 'int', '35');
        });
    });
    it('can read and set array elements in a program', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // skip ahead to array initialization
            const br = yield dc.setBreakpointsRequest({ source: { path: varsSrc }, breakpoints: [{ line: 24 }] });
            chai_1.expect(br.success).to.equal(true);
            yield dc.continueRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            // assert we can see the array and its elements
            let vr = scope.scopes.body.scopes[0].variablesReference;
            let vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[6], 'f', 'int [3]', undefined, true);
            chai_1.expect(hexValueRegex.test(vars.body.variables[6].value), 'The display value of the array is not a hexidecimal address').to.equal(true);
            const childVR = vars.body.variables[6].variablesReference;
            let children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], '[0]', 'int', '1');
            utils_1.verifyVariable(children.body.variables[1], '[1]', 'int', '2');
            utils_1.verifyVariable(children.body.variables[2], '[2]', 'int', '3');
            // set the variables to something different
            yield dc.setVariableRequest({ name: '[0]', value: '11', variablesReference: childVR });
            yield dc.setVariableRequest({ name: '[1]', value: '22', variablesReference: childVR });
            yield dc.setVariableRequest({ name: '[2]', value: '33', variablesReference: childVR });
            // assert that the variables have been updated to the new values
            children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], '[0]', 'int', '11');
            utils_1.verifyVariable(children.body.variables[1], '[1]', 'int', '22');
            utils_1.verifyVariable(children.body.variables[2], '[2]', 'int', '33');
            // step the program and see that the values were passed to the program and evaluated.
            yield dc.nextRequest({ threadId: scope.threadId });
            scope = yield utils_1.getScopes(dc);
            chai_1.expect(scope.scopes.body.scopes.length, 'Unexpected number of scopes returned').to.equal(1);
            vr = scope.scopes.body.scopes[0].variablesReference;
            vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(numVars);
            utils_1.verifyVariable(vars.body.variables[7], 'g', 'int', '66');
        });
    });
});
//# sourceMappingURL=var.spec.js.map