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
/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
const cp = require("child_process");
const vscode_debugadapter_testsupport_1 = require("vscode-debugadapter-testsupport");
/**
 * Extend the DebugClient to support Reverse Requests:
 * https://microsoft.github.io/debug-adapter-protocol/specification#Reverse_Requests_RunInTerminal
 */
class CdtDebugClient extends vscode_debugadapter_testsupport_1.DebugClient {
    constructor() {
        super(...arguments);
        /**
         * Reverse Request Handlers:
         */
        this.reverseRequestHandlers = {
            runInTerminal: (args) => __awaiter(this, void 0, void 0, function* () {
                const process = yield new Promise((resolve, reject) => {
                    const child = cp.spawn(args.args[0], args.args.slice(1), {
                        cwd: args.cwd,
                        env: sanitizeEnv(args.env),
                    });
                    if (typeof child.pid !== 'undefined') {
                        return resolve(child);
                    }
                    child.once('error', (error) => {
                        reject(error);
                    });
                });
                return {
                    processId: process.pid,
                };
            }),
        };
    }
    /**
     * Notify the Debug Adapter by default that this client supports `runInTerminal`.
     */
    initializeRequest(args) {
        if (!args) {
            args = {
                supportsRunInTerminalRequest: true,
                adapterID: this['_debugType'],
                linesStartAt1: true,
                columnsStartAt1: true,
                pathFormat: 'path',
            };
        }
        return super.initializeRequest(args);
    }
    /**
     * Send a response following a Debug Adapter Reverse Request.
     * @param request original request to respond to.
     * @param handler processes the request and returns the response body.
     */
    doRespond(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { command } = request;
            const handler = this['reverseRequestHandlers'][command];
            const response = {
                type: 'response',
                request_seq: request.seq,
                command,
                success: true,
            };
            if (!handler) {
                response.success = false;
                response.message = `Unknown command: ${command}`;
            }
            else {
                try {
                    response.body = yield handler(request.arguments);
                }
                catch (error) {
                    response.success = false;
                    response.message = error instanceof Error ? error.message : error;
                }
            }
            const json = JSON.stringify(response);
            this['outputStream'].write(`Content-Length: ${Buffer.byteLength(json, 'utf-8')}\r\n\r\n${json}`);
        });
    }
}
exports.CdtDebugClient = CdtDebugClient;
/**
 * DebugProtocol.dispatch is private, overriding manually.
 */
CdtDebugClient.prototype['dispatch'] = function dispatch(raw) {
    const message = JSON.parse(raw);
    if (isRequest(message)) {
        this['doRespond'](message);
    }
    else {
        vscode_debugadapter_testsupport_1.DebugClient.prototype['dispatch'].apply(this, [raw]);
    }
};
function isRequest(message) {
    return message.type === 'request';
}
function sanitizeEnv(env) {
    if (!env) {
        return {};
    }
    const sanitized = {};
    for (const key of Object.keys(env)) {
        if (typeof env[key] === 'string') {
            sanitized[key] = env[key];
        }
    }
    return sanitized;
}
//# sourceMappingURL=debugClient.js.map