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
// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions
describe('Memory Test Suite', function () {
    let dc;
    let frame;
    const memProgram = path.join(utils_1.testProgramsDir, 'mem');
    const memSrc = path.join(utils_1.testProgramsDir, 'mem.c');
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            dc = yield utils_1.standardBeforeEach();
            yield dc.hitBreakpoint({
                gdb: utils_1.gdbPath,
                program: memProgram,
                openGdbConsole: utils_1.openGdbConsole,
            }, {
                path: memSrc,
                line: 12,
            });
            const threads = yield dc.threadsRequest();
            // On windows additional threads can exist to handle signals, therefore find
            // the real thread & frame running the user code. The other thread will
            // normally be running code from ntdll or similar.
            loop_threads: for (const thread of threads.body.threads) {
                const stack = yield dc.stackTraceRequest({ threadId: thread.id });
                if (stack.body.stackFrames.length >= 1) {
                    for (const f of stack.body.stackFrames) {
                        if (f.source && f.source.name === 'mem.c') {
                            frame = f;
                            break loop_threads;
                        }
                    }
                }
            }
            // Make sure we found the expected frame
            chai_1.expect(frame).not.eq(undefined);
        });
    });
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield dc.stop();
        });
    });
    /**
     * Verify that `resp` contains the bytes `expectedBytes` and the
     * `expectedAddress` start address.
     *
     * `expectedAddress` should be an hexadecimal string, with the leading 0x.
     */
    function verifyMemoryReadResult(resp, expectedBytes, expectedAddress) {
        chai_1.expect(resp.body.data).eq(expectedBytes);
        chai_1.expect(resp.body.address).match(/^0x[0-9a-fA-F]+$/);
        const actualAddress = parseInt(resp.body.address, 16);
        chai_1.expect(actualAddress).eq(expectedAddress);
    }
    // Test reading memory using cdt-gdb-adapter's extension request.
    it('can read memory', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the address of the array.
            const addrOfArrayResp = yield dc.evaluateRequest({ expression: '&array', frameId: frame.id });
            const addrOfArray = parseInt(addrOfArrayResp.body.result, 16);
            let mem = (yield dc.send('cdt-gdb-adapter/Memory', {
                address: '0x' + addrOfArray.toString(16),
                length: 10,
            }));
            verifyMemoryReadResult(mem, 'f1efd4fd7248450c2d13', addrOfArray);
            mem = (yield dc.send('cdt-gdb-adapter/Memory', {
                address: '&array[3 + 2]',
                length: 10,
            }));
            verifyMemoryReadResult(mem, '48450c2d1374d6f612dc', addrOfArray + 5);
            mem = (yield dc.send('cdt-gdb-adapter/Memory', {
                address: 'parray',
                length: 10,
            }));
            verifyMemoryReadResult(mem, 'f1efd4fd7248450c2d13', addrOfArray);
        });
    });
    it('handles unable to read memory', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // This test will only work for targets for which address 0 is not readable, which is good enough for now.
            const err = yield utils_1.expectRejection(dc.send('cdt-gdb-adapter/Memory', {
                address: '0',
                length: 10,
            }));
            chai_1.expect(err.message).contains('Unable to read memory');
        });
    });
    it('can read memory with offset', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const addrOfArrayResp = yield dc.evaluateRequest({ expression: '&array', frameId: frame.id });
            const addrOfArray = parseInt(addrOfArrayResp.body.result, 16);
            // Test positive offset
            let offset = 5;
            let mem = (yield dc.send('cdt-gdb-adapter/Memory', {
                address: '&array',
                length: 5,
                offset,
            }));
            verifyMemoryReadResult(mem, '48450c2d13', addrOfArray + offset);
            // Test negative offset
            offset = -5;
            mem = (yield dc.send('cdt-gdb-adapter/Memory', {
                address: `array + ${-offset}`,
                length: 10,
                offset,
            }));
            verifyMemoryReadResult(mem, 'f1efd4fd7248450c2d13', addrOfArray);
        });
    });
});
//# sourceMappingURL=mem.spec.js.map