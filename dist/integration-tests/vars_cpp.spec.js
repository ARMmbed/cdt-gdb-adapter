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
describe('Variables CPP Test Suite', function () {
    let dc;
    let scope;
    const varsCppProgram = path.join(utils_1.testProgramsDir, 'vars_cpp');
    const varsCppSrc = path.join(utils_1.testProgramsDir, 'vars_cpp.cpp');
    const lineTags = {
        'STOP HERE': 0,
    };
    before(function () {
        utils_1.resolveLineTagLocations(varsCppSrc, lineTags);
    });
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            dc = yield utils_1.standardBeforeEach();
            yield dc.hitBreakpoint({
                verbose: true,
                gdb: utils_1.gdbPath,
                program: varsCppProgram,
                openGdbConsole: utils_1.openGdbConsole,
            }, {
                path: varsCppSrc,
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
    // Move the timeout out of the way if the adapter is going to be debugged.
    if (process.env.INSPECT_DEBUG_ADAPTER) {
        this.timeout(9999999);
    }
    it('can read and set a cpp object variable', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // check the initial conditions of the two variables
            const vr = scope.scopes.body.scopes[0].variablesReference;
            const vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(3);
            utils_1.verifyVariable(vars.body.variables[0], 'fooA', 'Foo *', undefined, true);
            utils_1.verifyVariable(vars.body.variables[1], 'fooB', 'Foo *', undefined, true);
            chai_1.expect(vars.body.variables[0].value, 'Value of fooA matches fooB').to.not.equal(vars.body.variables[1].value);
            // check that the children names and values are the same, but values are different
            let childrenA = yield dc.variablesRequest({ variablesReference: vars.body.variables[0].variablesReference });
            let childrenB = yield dc.variablesRequest({ variablesReference: vars.body.variables[1].variablesReference });
            chai_1.expect(childrenA.body.variables.length, 'There is a different number of child variables than expected').to.equal(childrenB.body.variables.length);
            utils_1.compareVariable(childrenA.body.variables[0], childrenB.body.variables[0], true, true, false);
            utils_1.compareVariable(childrenA.body.variables[1], childrenB.body.variables[1], true, true, false);
            utils_1.compareVariable(childrenA.body.variables[2], childrenB.body.variables[2], true, true, false);
            // set fooA to be equal to fooB.
            yield dc.setVariableRequest({ name: 'fooA', value: vars.body.variables[1].value, variablesReference: vr });
            // check types and value after the set
            const vars2 = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars2.body.variables.length, 'There is a different number of variables than expected').to.equal(3);
            utils_1.compareVariable(vars2.body.variables[0], vars2.body.variables[1], false, true, true);
            // check the objects are identical
            childrenA = yield dc.variablesRequest({ variablesReference: vars2.body.variables[0].variablesReference });
            childrenB = yield dc.variablesRequest({ variablesReference: vars2.body.variables[1].variablesReference });
            utils_1.compareVariable(childrenA.body.variables[0], childrenB.body.variables[0], true, true, true);
            utils_1.compareVariable(childrenA.body.variables[1], childrenB.body.variables[1], true, true, true);
            utils_1.compareVariable(childrenA.body.variables[2], childrenB.body.variables[2], true, true, true);
        });
    });
    it('can read and set nested variables from a cpp object', function () {
        return __awaiter(this, void 0, void 0, function* () {
            // check initial conditions of fooA and its child elements
            const vr = scope.scopes.body.scopes[0].variablesReference;
            const vars = yield dc.variablesRequest({ variablesReference: vr });
            chai_1.expect(vars.body.variables.length, 'There is a different number of variables than expected').to.equal(3);
            utils_1.verifyVariable(vars.body.variables[0], 'fooA', 'Foo *', undefined, true);
            chai_1.expect(vars.body.variables[0].variablesReference, `${vars.body.variables[0].name} has no children`).to.not.equal(0);
            const childVR = vars.body.variables[0].variablesReference;
            let children = yield dc.variablesRequest({ variablesReference: childVR });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], 'a', 'int', '1');
            utils_1.verifyVariable(children.body.variables[1], 'c', 'char', '97 \'a\'');
            utils_1.verifyVariable(children.body.variables[2], 'b', 'int', '2');
            // set child value
            yield dc.setVariableRequest({
                name: children.body.variables[0].name,
                value: '55',
                variablesReference: vars.body.variables[0].variablesReference,
            });
            // check the new values
            children = yield dc.variablesRequest({ variablesReference: vars.body.variables[0].variablesReference });
            chai_1.expect(children.body.variables.length, 'There is a different number of child variables than expected').to.equal(3);
            utils_1.verifyVariable(children.body.variables[0], 'a', 'int', '55');
            // these two values should be unchanged.
            utils_1.verifyVariable(children.body.variables[1], 'c', 'char', '97 \'a\'');
            utils_1.verifyVariable(children.body.variables[2], 'b', 'int', '2');
        });
    });
});
//# sourceMappingURL=vars_cpp.spec.js.map