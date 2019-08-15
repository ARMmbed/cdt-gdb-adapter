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
const GDBDebugSession_1 = require("./GDBDebugSession");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const mi = require("./mi");
const child_process_1 = require("child_process");
class GDBTargetDebugSession extends GDBDebugSession_1.GDBDebugSession {
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.setupCommonLoggerAndHandlers(args);
                yield this.startGDBServer(args);
                yield this.startGDBAndAttachToTarget(response, args);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    attachRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.setupCommonLoggerAndHandlers(args);
                yield this.startGDBAndAttachToTarget(response, args);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    setupCommonLoggerAndHandlers(args) {
        vscode_debugadapter_1.logger.setup(args.verbose ? vscode_debugadapter_1.Logger.LogLevel.Verbose : vscode_debugadapter_1.Logger.LogLevel.Warn, args.logFile || false);
        this.gdb.on('consoleStreamOutput', (output, category) => {
            this.sendEvent(new vscode_debugadapter_1.OutputEvent(output, category));
        });
        this.gdb.on('execAsync', (resultClass, resultData) => this.handleGDBAsync(resultClass, resultData));
        this.gdb.on('notifyAsync', (resultClass, resultData) => this.handleGDBNotify(resultClass, resultData));
    }
    startGDBServer(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.target === undefined) {
                args.target = {};
            }
            const target = args.target;
            const serverExe = target.server !== undefined ? target.server : 'gdbserver';
            const serverParams = target.serverParameters !== undefined
                ? target.serverParameters : ['--once', ':0', args.program];
            // Wait until gdbserver is started and ready to receive connections.
            yield new Promise((resolve, reject) => {
                this.gdbserver = child_process_1.spawn(serverExe, serverParams, { cwd: args.cwd });
                let gdbserverStartupResolved = false;
                let accumulatedStderr = '';
                let checkTargetPort = (data) => {
                    // do nothing by default
                };
                if (target.port && target.serverParameters) {
                    setTimeout(() => {
                        gdbserverStartupResolved = true;
                        resolve();
                    }, target.serverStartupDelay !== undefined ? target.serverStartupDelay : 0);
                }
                else {
                    checkTargetPort = (data) => {
                        const regex = new RegExp(target.serverPortRegExp
                            ? target.serverPortRegExp : 'Listening on port ([0-9]+)');
                        const m = regex.exec(data);
                        if (m !== null) {
                            target.port = m[1];
                            setTimeout(() => {
                                gdbserverStartupResolved = true;
                                resolve();
                            }, target.serverStartupDelay !== undefined ? target.serverStartupDelay : 0);
                        }
                    };
                }
                this.gdbserver.stdout.on('data', (data) => {
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(data.toString(), 'server'));
                    checkTargetPort(data);
                });
                this.gdbserver.stderr.on('data', (data) => {
                    const err = data.toString();
                    accumulatedStderr += err;
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(err, 'server'));
                    checkTargetPort(data);
                });
                this.gdbserver.on('exit', (code) => {
                    const exitmsg = `${serverExe} has exited with code ${code}`;
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(exitmsg, 'server'));
                    if (!gdbserverStartupResolved) {
                        gdbserverStartupResolved = true;
                        reject(new Error(exitmsg + '\n' + accumulatedStderr));
                    }
                });
                this.gdbserver.on('error', (err) => {
                    const errmsg = `${serverExe} has hit error ${err}`;
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(errmsg, 'server'));
                    if (!gdbserverStartupResolved) {
                        gdbserverStartupResolved = true;
                        reject(new Error(errmsg + '\n' + accumulatedStderr));
                    }
                });
            });
        });
    }
    startGDBAndAttachToTarget(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.target === undefined) {
                args.target = {};
            }
            const target = args.target;
            try {
                this.isAttach = true;
                yield this.spawn(args);
                yield this.gdb.sendFileExecAndSymbols(args.program);
                yield this.gdb.sendEnablePrettyPrint();
                if (args.imageAndSymbols) {
                    if (args.imageAndSymbols.symbolFileName) {
                        if (args.imageAndSymbols.symbolOffset) {
                            yield this.gdb.sendAddSymbolFile(args.imageAndSymbols.symbolFileName, args.imageAndSymbols.symbolOffset);
                        }
                        else {
                            yield this.gdb.sendFileSymbolFile(args.imageAndSymbols.symbolFileName);
                        }
                    }
                }
                if (target.connectCommands === undefined) {
                    const targetType = target.type !== undefined ? target.type : 'remote';
                    let defaultTarget;
                    if (target.port !== undefined) {
                        defaultTarget = [target.host !== undefined
                                ? `${target.host}:${target.port}` : `localhost:${target.port}`];
                    }
                    else {
                        defaultTarget = [];
                    }
                    const targetParameters = target.parameters !== undefined ? target.parameters : defaultTarget;
                    yield mi.sendTargetSelectRequest(this.gdb, { type: targetType, parameters: targetParameters });
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(`connected to ${targetType} target ${targetParameters.join(' ')}`));
                }
                else {
                    yield this.gdb.sendCommands(target.connectCommands);
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent('connected to target using provided connectCommands'));
                }
                yield this.gdb.sendCommands(args.initCommands);
                if (args.imageAndSymbols) {
                    if (args.imageAndSymbols.imageFileName) {
                        yield this.gdb.sendLoad(args.imageAndSymbols.imageFileName, args.imageAndSymbols.imageOffset);
                    }
                }
                yield this.gdb.sendCommands(args.preRunCommands);
                this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
}
exports.GDBTargetDebugSession = GDBTargetDebugSession;
//# sourceMappingURL=GDBTargetDebugSession.js.map