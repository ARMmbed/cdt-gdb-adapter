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
Object.defineProperty(exports, "__esModule", { value: true });
function sendDataReadMemoryBytes(gdb, address, size, offset = 0) {
    return gdb.sendCommand(`-data-read-memory-bytes -o ${offset} "${address}" ${size}`);
}
exports.sendDataReadMemoryBytes = sendDataReadMemoryBytes;
function sendDataEvaluateExpression(gdb, expr) {
    return gdb.sendCommand(`-data-evaluate-expression "${expr}"`);
}
exports.sendDataEvaluateExpression = sendDataEvaluateExpression;
//# sourceMappingURL=data.js.map