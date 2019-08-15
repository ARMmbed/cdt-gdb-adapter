"use strict";
/*********************************************************************
 * Copyright (c) 2019 Kichwa Coders and others
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
const cp = require("child_process");
const path = require("path");
const utils_1 = require("./utils");
const utils_2 = require("./utils");
// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions
describe('attach remote', function () {
    let dc;
    let gdbserver;
    let port;
    const emptyProgram = path.join(utils_1.testProgramsDir, 'empty');
    const emptySrc = path.join(utils_1.testProgramsDir, 'empty.c');
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            dc = yield utils_1.standardBeforeEach('debugTargetAdapter.js');
            gdbserver = cp.spawn(utils_1.gdbServerPath, [':0', emptyProgram], { cwd: utils_1.testProgramsDir });
            port = yield new Promise((resolve, reject) => {
                gdbserver.stderr.on('data', (data) => {
                    const line = String(data);
                    const LISTENING_ON_PORT = 'Listening on port ';
                    const index = line.indexOf(LISTENING_ON_PORT);
                    if (index >= 0) {
                        const portStr = line.substr(index + LISTENING_ON_PORT.length, 6).trim();
                        resolve(parseInt(portStr, 10));
                    }
                });
            });
        });
    });
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield gdbserver.kill();
            yield dc.stop();
        });
    });
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('can attach remote and hit a breakpoint', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.hitBreakpoint({
                verbose: true,
                gdb: utils_2.gdbPath,
                program: emptyProgram,
                openGdbConsole: utils_2.openGdbConsole,
                target: {
                    type: 'remote',
                    parameters: [`localhost:${port}`],
                },
            }, {
                path: emptySrc,
                line: 3,
            });
        });
    });
});
//# sourceMappingURL=attachRemote.spec.js.map