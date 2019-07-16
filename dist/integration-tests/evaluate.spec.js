"use strict";
/*********************************************************************
 * Copyright (c) 2019 Ericsson and others
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
const evaluateProgram = path.join(utils_1.testProgramsDir, 'evaluate');
const evaluateSrc = path.join(utils_1.testProgramsDir, 'evaluate.cpp');
before(utils_1.standardBefore);
beforeEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Move the timeout out of the way if the adapter is going to be debugged.
        if (process.env.INSPECT_DEBUG_ADAPTER) {
            this.timeout(9999999);
        }
        dc = yield utils_1.standardBeforeEach();
        yield dc.hitBreakpoint({
            verbose: true,
            gdb: utils_1.gdbPath,
            program: evaluateProgram,
            logFile: '/tmp/gdb.log',
            openGdbConsole: utils_1.openGdbConsole,
        }, {
            path: evaluateSrc,
            line: 2,
        });
        scope = yield utils_1.getScopes(dc);
    });
});
afterEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield dc.stop();
    });
});
describe('evaluate request', function () {
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('should evaluate a simple literal expression', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield dc.evaluateRequest({
                context: 'repl',
                expression: '2 + 2',
                frameId: scope.frameId,
            });
            chai_1.expect(res.body.result).eq('4');
        });
    });
    it('should reject evaluation of expression without a frame', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const err = yield utils_1.expectRejection(dc.evaluateRequest({
                context: 'repl',
                expression: '2 + 2',
            }));
            chai_1.expect(err.message).eq('Evaluation of expression without frameId is not supported.');
        });
    });
    it('should reject evaluation of invalid expression', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const err = yield utils_1.expectRejection(dc.evaluateRequest({
                context: 'repl',
                expression: '2 +',
                frameId: scope.frameId,
            }));
            chai_1.expect(err.message).eq('-var-create: unable to create variable object');
        });
    });
});
//# sourceMappingURL=evaluate.spec.js.map