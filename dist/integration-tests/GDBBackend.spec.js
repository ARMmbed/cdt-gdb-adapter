"use strict";
/*********************************************************************
 * Copyright (c) 2019 QNX Software Systems and others
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
const __1 = require("..");
describe('GDB Backend Test Suite', function () {
    let gdb;
    beforeEach(function () {
        gdb = new __1.GDBBackend();
        const args = {
            program: 'foo',
        };
        gdb.spawn(args);
    });
    afterEach(function () {
        gdb.sendGDBExit();
    });
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('can read a value from -gdb-show', function () {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield gdb.sendGDBShow('width');
            chai_1.expect(response.value).to.be.a('string');
            chai_1.expect(Number(response.value)).to.be.not.equal(NaN);
            chai_1.expect(Number(response.value)).to.be.greaterThan(0);
        });
    });
    it('can set a value using -gdb-set', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield gdb.sendGDBSet('width 88');
            const response = yield gdb.sendGDBShow('width');
            chai_1.expect(response.value).to.equal('88');
        });
    });
});
//# sourceMappingURL=GDBBackend.spec.js.map