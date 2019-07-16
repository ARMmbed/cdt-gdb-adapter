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
const path = require("path");
const utils_1 = require("./utils");
const utils_2 = require("./utils");
// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions
let dc;
const emptyProgram = path.join(utils_1.testProgramsDir, 'empty');
const emptySrc = path.join(utils_1.testProgramsDir, 'empty.c');
before(utils_1.standardBefore);
beforeEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        dc = yield utils_1.standardBeforeEach();
    });
});
afterEach(function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield dc.stop();
    });
});
describe('launch', function () {
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('can launch and hit a breakpoint', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.hitBreakpoint({
                verbose: true,
                gdb: utils_2.gdbPath,
                program: emptyProgram,
                openGdbConsole: utils_2.openGdbConsole,
            }, {
                path: emptySrc,
                line: 3,
            });
        });
    });
    it('reports an error when specifying a non-existent binary', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const errorMessage = yield new Promise((resolve, reject) => {
                dc.launchRequest({
                    verbose: true,
                    gdb: utils_2.gdbPath,
                    program: '/does/not/exist',
                    openGdbConsole: utils_2.openGdbConsole,
                })
                    .then(reject)
                    .catch(resolve);
            });
            chai_1.expect(errorMessage.message).eq('/does/not/exist: No such file or directory.');
        });
    });
});
//# sourceMappingURL=launch.spec.js.map