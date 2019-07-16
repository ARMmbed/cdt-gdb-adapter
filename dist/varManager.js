"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const var_1 = require("./mi/var");
const variableMap = new Map();
function getKey(frameId, threadId, depth) {
    return `frame${frameId}_thread${threadId}_depth${depth}`;
}
exports.getKey = getKey;
function getVars(frameId, threadId, depth) {
    return variableMap.get(getKey(frameId, threadId, depth));
}
exports.getVars = getVars;
function getVar(frameId, threadId, depth, expression) {
    const vars = getVars(frameId, threadId, depth);
    if (vars) {
        for (const varobj of vars) {
            if (varobj.expression === expression) {
                return varobj;
            }
        }
    }
    return;
}
exports.getVar = getVar;
function getVarByName(frameId, threadId, depth, varname) {
    const vars = getVars(frameId, threadId, depth);
    if (vars) {
        for (const varobj of vars) {
            if (varobj.varname === varname) {
                return varobj;
            }
        }
    }
    return;
}
exports.getVarByName = getVarByName;
function addVar(frameId, threadId, depth, expression, isVar, isChild, varCreateResponse) {
    let vars = variableMap.get(getKey(frameId, threadId, depth));
    if (!vars) {
        vars = [];
        variableMap.set(getKey(frameId, threadId, depth), vars);
    }
    const varobj = {
        varname: varCreateResponse.name, expression, numchild: varCreateResponse.numchild,
        children: [], value: varCreateResponse.value, type: varCreateResponse.type, isVar, isChild,
    };
    vars.push(varobj);
    return varobj;
}
exports.addVar = addVar;
function removeVar(gdb, frameId, threadId, depth, varname) {
    return __awaiter(this, void 0, void 0, function* () {
        let deleteme;
        const vars = variableMap.get(getKey(frameId, threadId, depth));
        if (vars) {
            for (const varobj of vars) {
                if (varobj.varname === varname) {
                    deleteme = varobj;
                    break;
                }
            }
            if (deleteme) {
                yield var_1.sendVarDelete(gdb, { varname: deleteme.varname });
                vars.splice(vars.indexOf(deleteme), 1);
                for (const child of deleteme.children) {
                    yield removeVar(gdb, frameId, threadId, depth, child.varname);
                }
            }
        }
    });
}
exports.removeVar = removeVar;
function updateVar(gdb, frameId, threadId, depth, varobj) {
    return __awaiter(this, void 0, void 0, function* () {
        let returnVar = varobj;
        const vup = yield var_1.sendVarUpdate(gdb, { threadId, name: varobj.varname });
        const update = vup.changelist[0];
        if (update) {
            if (update.in_scope === 'true') {
                if (update.name === varobj.varname) {
                    // don't update the parent value to a child's value
                    varobj.value = update.value;
                }
            }
            else {
                removeVar(gdb, frameId, threadId, depth, varobj.varname);
                yield var_1.sendVarDelete(gdb, { varname: varobj.varname });
                const createResponse = yield var_1.sendVarCreate(gdb, { frame: 'current', expression: varobj.expression });
                returnVar = addVar(frameId, threadId, depth, varobj.expression, varobj.isVar, varobj.isChild, createResponse);
            }
        }
        return Promise.resolve(returnVar);
    });
}
exports.updateVar = updateVar;
//# sourceMappingURL=varManager.js.map