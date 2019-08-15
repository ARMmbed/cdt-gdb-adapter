"use strict";
/*********************************************************************
 * Copyright (c) 2019 Arm and others
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
const path = require("path");
const utils_1 = require("./utils");
describe('breakpoints', () => __awaiter(this, void 0, void 0, function* () {
    let dc;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        dc = yield utils_1.standardBeforeEach();
        yield dc.launchRequest({
            verbose: true,
            gdb: utils_1.gdbPath,
            program: path.join(utils_1.testProgramsDir, 'count'),
            openGdbConsole: utils_1.openGdbConsole,
        });
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        yield dc.stop();
    }));
    it('hits a standard breakpoint', () => __awaiter(this, void 0, void 0, function* () {
        yield dc.setBreakpointsRequest({
            source: {
                name: 'count.c',
                path: path.join(utils_1.testProgramsDir, 'count.c'),
            },
            breakpoints: [
                {
                    column: 1,
                    line: 4,
                },
            ],
        });
        yield dc.configurationDoneRequest();
        const scope = yield utils_1.getScopes(dc);
        const vr = scope.scopes.body.scopes[0].variablesReference;
        const vars = yield dc.variablesRequest({ variablesReference: vr });
        utils_1.verifyVariable(vars.body.variables[0], 'count', 'int', '0');
    }));
    it('hits a conditional breakpoint', () => __awaiter(this, void 0, void 0, function* () {
        yield dc.setBreakpointsRequest({
            source: {
                name: 'count.c',
                path: path.join(utils_1.testProgramsDir, 'count.c'),
            },
            breakpoints: [
                {
                    column: 1,
                    line: 4,
                    condition: 'count == 5',
                },
            ],
        });
        yield dc.configurationDoneRequest();
        const scope = yield utils_1.getScopes(dc);
        const vr = scope.scopes.body.scopes[0].variablesReference;
        const vars = yield dc.variablesRequest({ variablesReference: vr });
        utils_1.verifyVariable(vars.body.variables[0], 'count', 'int', '5');
    }));
}));
//# sourceMappingURL=breakpoints.spec.js.map