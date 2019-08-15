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
function sendBreakInsert(gdb, request) {
    return __awaiter(this, void 0, void 0, function* () {
        // Todo: lots of options
        const escapedLocation = gdb.standardEscape(request.location);
        const result = yield gdb.sendCommand(`-break-insert ${escapedLocation}`);
        if (request.condition) {
            yield gdb.sendCommand(`-break-condition ${result.bkpt.number} ${request.condition}`);
        }
        return result;
    });
}
exports.sendBreakInsert = sendBreakInsert;
function sendBreakDelete(gdb, request) {
    return gdb.sendCommand(`-break-delete ${request.breakpoints.join(' ')}`);
}
exports.sendBreakDelete = sendBreakDelete;
function sendBreakList(gdb) {
    return gdb.sendCommand('-break-list');
}
exports.sendBreakList = sendBreakList;
//# sourceMappingURL=breakpoint.js.map