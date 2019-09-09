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
 * Copyright (c) 2018 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
const os = require("os");
const path = require("path");
const vscode_debugadapter_1 = require("vscode-debugadapter");
const GDBBackend_1 = require("./GDBBackend");
const mi = require("./mi");
const data_1 = require("./mi/data");
const varMgr = require("./varManager");
const arrayRegex = /.*\[[\d]+\].*/;
const arrayChildRegex = /[\d]+/;
class GDBDebugSession extends vscode_debugadapter_1.LoggingDebugSession {
    constructor() {
        super();
        this.gdb = this.createBackend();
        this.isAttach = false;
        this.isRunning = false;
        this.supportsRunInTerminalRequest = false;
        this.supportsGdbConsole = false;
        this.frameHandles = new vscode_debugadapter_1.Handles();
        this.variableHandles = new vscode_debugadapter_1.Handles();
        this.threads = [];
        this.logger = vscode_debugadapter_1.logger;
    }
    createBackend() {
        return new GDBBackend_1.GDBBackend();
    }
    /**
     * Handle requests not defined in the debug adapter protocol.
     */
    customRequest(command, response, args) {
        if (command === 'cdt-gdb-adapter/Memory') {
            this.memoryRequest(response, args);
        }
        else {
            return super.customRequest(command, response, args);
        }
    }
    initializeRequest(response, args) {
        this.supportsRunInTerminalRequest = args.supportsRunInTerminalRequest === true;
        this.supportsGdbConsole = os.platform() === 'linux' && this.supportsRunInTerminalRequest;
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsSetVariable = true;
        response.body.supportsConditionalBreakpoints = true;
        // response.body.supportsSetExpression = true;
        this.sendResponse(response);
    }
    attachRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                vscode_debugadapter_1.logger.setup(args.verbose ? vscode_debugadapter_1.Logger.LogLevel.Verbose : vscode_debugadapter_1.Logger.LogLevel.Warn, args.logFile || false);
                this.gdb.on('consoleStreamOutput', (output, category) => {
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(output, category));
                });
                this.gdb.on('execAsync', (resultClass, resultData) => this.handleGDBAsync(resultClass, resultData));
                this.gdb.on('notifyAsync', (resultClass, resultData) => this.handleGDBNotify(resultClass, resultData));
                yield this.spawn(args);
                yield this.gdb.sendFileExecAndSymbols(args.program);
                yield this.gdb.sendEnablePrettyPrint();
                yield mi.sendTargetAttachRequest(this.gdb, { pid: args.processId });
                this.sendEvent(new vscode_debugadapter_1.OutputEvent(`attached to process ${args.processId}`));
                yield this.gdb.sendCommands(args.initCommands);
                this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    launchRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                vscode_debugadapter_1.logger.setup(args.verbose ? vscode_debugadapter_1.Logger.LogLevel.Verbose : vscode_debugadapter_1.Logger.LogLevel.Warn, args.logFile || false);
                this.gdb.on('consoleStreamOutput', (output, category) => {
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent(output, category));
                });
                this.gdb.on('execAsync', (resultClass, resultData) => this.handleGDBAsync(resultClass, resultData));
                this.gdb.on('notifyAsync', (resultClass, resultData) => this.handleGDBNotify(resultClass, resultData));
                yield this.spawn(args);
                yield this.gdb.sendFileExecAndSymbols(args.program);
                yield this.gdb.sendEnablePrettyPrint();
                if (args.initCommands) {
                    for (const command of args.initCommands) {
                        yield this.gdb.sendCommand(command);
                    }
                }
                if (args.arguments) {
                    yield mi.sendExecArguments(this.gdb, { arguments: args.arguments });
                }
                this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    spawn(args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.openGdbConsole) {
                if (!this.supportsGdbConsole) {
                    vscode_debugadapter_1.logger.warn('cdt-gdb-adapter: openGdbConsole is not supported on this platform');
                }
                else if (!(yield this.gdb.supportsNewUi(args.gdb))) {
                    vscode_debugadapter_1.logger.warn(`cdt-gdb-adapter: new-ui command not detected (${args.gdb || 'gdb'})`);
                }
                else {
                    vscode_debugadapter_1.logger.verbose('cdt-gdb-adapter: spawning gdb console in client terminal');
                    return this.spawnInClientTerminal(args);
                }
            }
            return this.gdb.spawn(args);
        });
    }
    spawnInClientTerminal(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gdb.spawnInClientTerminal(args, (command) => __awaiter(this, void 0, void 0, function* () {
                const response = yield new Promise((resolve) => this.sendRequest('runInTerminal', {
                    kind: 'integrated',
                    cwd: process.cwd(),
                    env: process.env,
                    args: command,
                }, 5000, resolve));
                if (!response.success) {
                    const message = `could not start the terminal on the client: ${response.message}`;
                    vscode_debugadapter_1.logger.error(message);
                    throw new Error(message);
                }
            }));
        });
    }
    setBreakPointsRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const neededPause = this.isRunning;
            if (neededPause) {
                // Need to pause first
                const waitPromise = new Promise((resolve) => {
                    this.waitPaused = resolve;
                });
                this.gdb.pause();
                yield waitPromise;
            }
            try {
                // Need to get the list of current breakpoints in the file and then make sure
                // that we end up with the requested set of breakpoints for that file
                // deleting ones not requested and inserting new ones.
                const file = args.source.path;
                const breakpoints = args.breakpoints || [];
                let inserts = breakpoints.slice();
                const deletes = new Array();
                const actual = new Array();
                const result = yield mi.sendBreakList(this.gdb);
                result.BreakpointTable.body.forEach((gdbbp) => {
                    if (gdbbp.fullname === file && gdbbp.line) {
                        // TODO probably need more thorough checks than just line number
                        const line = parseInt(gdbbp.line, 10);
                        if (!breakpoints.find((vsbp) => vsbp.line === line)) {
                            deletes.push(gdbbp.number);
                        }
                        inserts = inserts.filter((vsbp) => {
                            if (vsbp.line !== line) {
                                return true;
                            }
                            if (vsbp.condition !== gdbbp.cond) {
                                return true;
                            }
                            actual.push({
                                verified: true,
                                line: gdbbp.line ? parseInt(gdbbp.line, 10) : 0,
                                id: parseInt(gdbbp.number, 10),
                            });
                            return false;
                        });
                    }
                });
                for (const vsbp of inserts) {
                    const gdbbp = yield mi.sendBreakInsert(this.gdb, {
                        location: `${file}:${vsbp.line}`,
                        condition: vsbp.condition,
                    });
                    actual.push({
                        id: parseInt(gdbbp.bkpt.number, 10),
                        line: gdbbp.bkpt.line ? parseInt(gdbbp.bkpt.line, 10) : 0,
                        verified: true,
                    });
                }
                response.body = {
                    breakpoints: actual,
                };
                if (deletes.length > 0) {
                    yield mi.sendBreakDelete(this.gdb, { breakpoints: deletes });
                }
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
            if (neededPause) {
                mi.sendExecContinue(this.gdb);
            }
        });
    }
    configurationDoneRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isAttach) {
                    yield mi.sendExecContinue(this.gdb);
                }
                else {
                    yield mi.sendExecRun(this.gdb);
                }
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 100, err.message);
            }
        });
    }
    convertThread(thread) {
        return new vscode_debugadapter_1.Thread(parseInt(thread.id, 10), thread.name ? thread.name : thread.id);
    }
    threadsRequest(response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isRunning) {
                    const result = yield mi.sendThreadInfoRequest(this.gdb, {});
                    this.threads = result.threads.map((thread) => this.convertThread(thread));
                }
                response.body = {
                    threads: this.threads,
                };
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    stackTraceRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const depthResult = yield mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
                const depth = parseInt(depthResult.depth, 10);
                const levels = args.levels ? (args.levels > depth ? depth : args.levels) : depth;
                const lowFrame = args.startFrame || 0;
                const highFrame = lowFrame + levels - 1;
                const listResult = yield mi.sendStackListFramesRequest(this.gdb, { lowFrame, highFrame });
                const stack = listResult.stack.map((frame) => {
                    let source;
                    if (frame.fullname) {
                        source = new vscode_debugadapter_1.Source(path.basename(frame.file || frame.fullname), frame.fullname);
                    }
                    let line;
                    if (frame.line) {
                        line = parseInt(frame.line, 10);
                    }
                    const frameHandle = this.frameHandles.create({
                        threadId: args.threadId,
                        frameId: parseInt(frame.level, 10),
                    });
                    return new vscode_debugadapter_1.StackFrame(frameHandle, frame.func || frame.fullname || '', source, line);
                });
                response.body = {
                    stackFrames: stack,
                    totalFrames: depth,
                };
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    nextRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mi.sendExecNext(this.gdb, args.threadId);
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    stepInRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mi.sendExecStep(this.gdb, args.threadId);
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    stepOutRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mi.sendExecFinish(this.gdb, args.threadId);
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    continueRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield mi.sendExecContinue(this.gdb, args.threadId);
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    pauseRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gdb.pause()) {
                response.success = false;
            }
            this.sendResponse(response);
        });
    }
    scopesRequest(response, args) {
        const frame = {
            type: 'frame',
            frameHandle: args.frameId,
        };
        response.body = {
            scopes: [
                new vscode_debugadapter_1.Scope('Local', this.variableHandles.create(frame), false),
            ],
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const variables = new Array();
            response.body = {
                variables,
            };
            try {
                const ref = this.variableHandles.get(args.variablesReference);
                if (!ref) {
                    this.sendResponse(response);
                    return;
                }
                if (ref.type === 'frame') {
                    response.body.variables = yield this.handleVariableRequestFrame(ref);
                }
                else if (ref.type === 'object') {
                    response.body.variables = yield this.handleVariableRequestObject(ref);
                }
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    setVariableRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ref = this.variableHandles.get(args.variablesReference);
                if (!ref) {
                    this.sendResponse(response);
                    return;
                }
                const frame = this.frameHandles.get(ref.frameHandle);
                if (!frame) {
                    this.sendResponse(response);
                    return;
                }
                const parentVarname = ref.type === 'object' ? ref.varobjName : '';
                const varname = parentVarname + (parentVarname === '' ? '' : '.') + args.name.replace(/^\[(\d+)\]/, '$1');
                const stackDepth = yield mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
                const depth = parseInt(stackDepth.depth, 10);
                let varobj = varMgr.getVar(frame.frameId, frame.threadId, depth, varname);
                let assign;
                if (varobj) {
                    assign = yield mi.sendVarAssign(this.gdb, { varname: varobj.varname, expression: args.value });
                }
                else {
                    try {
                        assign = yield mi.sendVarAssign(this.gdb, { varname, expression: args.value });
                    }
                    catch (err) {
                        if (parentVarname === '') {
                            throw err; // no recovery possible
                        }
                        const children = yield mi.sendVarListChildren(this.gdb, {
                            name: parentVarname,
                            printValues: 'all-values',
                        });
                        for (const child of children.children) {
                            if (this.isChildOfClass(child)) {
                                const grandchildVarname = child.name + '.' + args.name.replace(/^\[(\d+)\]/, '$1');
                                varobj = varMgr.getVar(frame.frameId, frame.threadId, depth, grandchildVarname);
                                try {
                                    assign = yield mi.sendVarAssign(this.gdb, {
                                        varname: grandchildVarname,
                                        expression: args.value,
                                    });
                                    break;
                                }
                                catch (err) {
                                    continue; // try another child
                                }
                            }
                        }
                        if (!assign) {
                            throw err; // no recovery possible
                        }
                    }
                }
                response.body = {
                    value: assign.value,
                    type: varobj ? varobj.type : undefined,
                    variablesReference: (varobj && parseInt(varobj.numchild, 10) > 0)
                        ? this.variableHandles.create({
                            type: 'object',
                            frameHandle: ref.frameHandle,
                            varobjName: varobj.varname,
                        })
                        : 0,
                };
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
            this.sendResponse(response);
        });
    }
    // protected async setExpressionRequest(response: DebugProtocol.SetExpressionResponse,
    //                                      args: DebugProtocol.SetExpressionArguments): Promise<void> {
    //     logger.error('got setExpressionRequest');
    //     this.sendResponse(response);
    // }
    evaluateRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            response.body = { result: 'Error: could not evaluate expression', variablesReference: 0 }; // default response
            try {
                if (args.frameId === undefined) {
                    throw new Error('Evaluation of expression without frameId is not supported.');
                }
                const frame = this.frameHandles.get(args.frameId);
                if (!frame) {
                    this.sendResponse(response);
                    return;
                }
                const stackDepth = yield mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
                const depth = parseInt(stackDepth.depth, 10);
                let varobj = varMgr.getVar(frame.frameId, frame.threadId, depth, args.expression);
                if (!varobj) {
                    const varCreateResponse = yield mi.sendVarCreate(this.gdb, { expression: args.expression, frame: 'current' });
                    varobj = varMgr.addVar(frame.frameId, frame.threadId, depth, args.expression, false, false, varCreateResponse);
                }
                else {
                    const vup = yield mi.sendVarUpdate(this.gdb, {
                        threadId: frame.threadId,
                        name: varobj.varname,
                    });
                    const update = vup.changelist[0];
                    if (update) {
                        if (update.in_scope === 'true') {
                            if (update.name === varobj.varname) {
                                varobj.value = update.value;
                            }
                        }
                        else {
                            varMgr.removeVar(this.gdb, frame.frameId, frame.threadId, depth, varobj.varname);
                            yield mi.sendVarDelete(this.gdb, { varname: varobj.varname });
                            const varCreateResponse = yield mi.sendVarCreate(this.gdb, { expression: args.expression, frame: 'current' });
                            varobj = varMgr.addVar(frame.frameId, frame.threadId, depth, args.expression, false, false, varCreateResponse);
                        }
                    }
                }
                if (varobj) {
                    response.body = {
                        result: varobj.value,
                        type: varobj.type,
                        variablesReference: parseInt(varobj.numchild, 10) > 0
                            ? this.variableHandles.create({
                                type: 'object',
                                frameHandle: args.frameId,
                                varobjName: varobj.varname,
                            })
                            : 0,
                    };
                }
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    /**
     * Implement the cdt-gdb-adapter/Memory request.
     */
    memoryRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (typeof (args.address) !== 'string') {
                    throw new Error(`Invalid type for 'address', expected string, got ${typeof (args.address)}`);
                }
                if (typeof (args.length) !== 'number') {
                    throw new Error(`Invalid type for 'length', expected number, got ${typeof (args.length)}`);
                }
                if (typeof (args.offset) !== 'number' && typeof (args.offset) !== 'undefined') {
                    throw new Error(`Invalid type for 'offset', expected number or undefined, got ${typeof (args.offset)}`);
                }
                const typedArgs = args;
                const result = yield data_1.sendDataReadMemoryBytes(this.gdb, typedArgs.address, typedArgs.length, typedArgs.offset);
                response.body = {
                    data: result.memory[0].contents,
                    address: result.memory[0].begin,
                };
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    disconnectRequest(response, args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.gdb.sendGDBExit();
                this.sendResponse(response);
            }
            catch (err) {
                this.sendErrorResponse(response, 1, err.message);
            }
        });
    }
    sendStoppedEvent(reason, threadId, exceptionText) {
        // Reset frame handles and variables for new context
        this.frameHandles.reset();
        this.variableHandles.reset();
        // Send the event
        this.sendEvent(new vscode_debugadapter_1.StoppedEvent(reason, threadId, exceptionText));
    }
    handleGDBStopped(result) {
        switch (result.reason) {
            case 'exited':
            case 'exited-normally':
                this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
                break;
            case 'breakpoint-hit':
                this.sendStoppedEvent('breakpoint', parseInt(result['thread-id'], 10));
                break;
            case 'end-stepping-range':
            case 'function-finished':
                this.sendStoppedEvent('step', parseInt(result['thread-id'], 10));
                break;
            case 'signal-received':
                const name = result['signal-name'] || 'signal';
                this.sendStoppedEvent(name, parseInt(result['thread-id'], 10));
                if (this.waitPaused) {
                    this.waitPaused();
                }
                break;
            default:
                this.sendStoppedEvent('generic', parseInt(result['thread-id'], 10));
        }
    }
    handleGDBAsync(resultClass, resultData) {
        switch (resultClass) {
            case 'running':
                this.isRunning = true;
                break;
            case 'stopped':
                if (this.isRunning) {
                    this.isRunning = false;
                    this.handleGDBStopped(resultData);
                }
                break;
            default:
                vscode_debugadapter_1.logger.warn(`GDB unhandled async: ${resultClass}: ${JSON.stringify(resultData)}`);
        }
    }
    handleGDBNotify(notifyClass, notifyData) {
        switch (notifyClass) {
            case 'thread-created':
                this.threads.push(this.convertThread(notifyData));
                break;
            case 'thread-selected':
            case 'thread-exited':
            case 'thread-group-added':
            case 'thread-group-started':
            case 'thread-group-exited':
            case 'library-loaded':
            case 'breakpoint-modified':
            case 'breakpoint-deleted':
                // Known unhandled notifies
                break;
            default:
                vscode_debugadapter_1.logger.warn(`GDB unhandled notify: ${notifyClass}: ${JSON.stringify(notifyData)}`);
        }
    }
    handleVariableRequestFrame(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize variables array and dereference the frame handle
            const variables = [];
            const frame = this.frameHandles.get(ref.frameHandle);
            if (!frame) {
                return Promise.resolve(variables);
            }
            // vars used to determine if we should call sendStackListVariables()
            let callStack = false;
            let numVars = 0;
            // stack depth necessary for differentiating between similarly named variables at different stack depths
            const stackDepth = yield mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
            const depth = parseInt(stackDepth.depth, 10);
            // array of varnames to delete. Cannot delete while iterating through the vars array below.
            const toDelete = new Array();
            // get the list of vars we need to update for this frameId/threadId/depth tuple
            const vars = varMgr.getVars(frame.frameId, frame.threadId, depth);
            if (vars) {
                for (const varobj of vars) {
                    // ignore expressions and child entries
                    if (varobj.isVar && !varobj.isChild) {
                        // request update from GDB
                        const vup = yield mi.sendVarUpdate(this.gdb, {
                            threadId: frame.threadId,
                            name: varobj.varname,
                        });
                        // if changelist is length 0, update is undefined
                        const update = vup.changelist[0];
                        let pushVar = true;
                        if (update) {
                            if (update.in_scope === 'true') {
                                numVars++;
                                if (update.name === varobj.varname) {
                                    // don't update the parent value to a child's value
                                    varobj.value = update.value;
                                }
                            }
                            else {
                                // var is out of scope, delete it and call sendStackListVariables() later
                                callStack = true;
                                pushVar = false;
                                toDelete.push(update.name);
                            }
                        }
                        else if (varobj.value) {
                            // value hasn't updated but it's still in scope
                            numVars++;
                        }
                        // only push entries to the result that aren't being deleted
                        if (pushVar) {
                            let value = varobj.value;
                            // if we have an array parent entry, we need to display the address.
                            if (arrayRegex.test(varobj.type)) {
                                value = yield this.getAddr(varobj);
                            }
                            variables.push({
                                name: varobj.expression,
                                value,
                                type: varobj.type,
                                variablesReference: parseInt(varobj.numchild, 10) > 0
                                    ? this.variableHandles.create({
                                        type: 'object',
                                        frameHandle: ref.frameHandle,
                                        varobjName: varobj.varname,
                                    })
                                    : 0,
                            });
                        }
                    }
                }
                // clean up out of scope entries
                for (const varname of toDelete) {
                    yield varMgr.removeVar(this.gdb, frame.frameId, frame.threadId, depth, varname);
                }
            }
            // if we had out of scope entries or no entries in the frameId/threadId/depth tuple, query GDB for new ones
            if (callStack === true || numVars === 0) {
                const result = yield mi.sendStackListVariables(this.gdb, {
                    thread: frame.threadId,
                    frame: frame.frameId,
                    printValues: 'simple-values',
                });
                for (const variable of result.variables) {
                    let varobj = varMgr.getVar(frame.frameId, frame.threadId, depth, variable.name);
                    if (!varobj) {
                        // create var in GDB and store it in the varMgr
                        const varCreateResponse = yield mi.sendVarCreate(this.gdb, {
                            frame: 'current', expression: variable.name,
                        });
                        varobj = varMgr.addVar(frame.frameId, frame.threadId, depth, variable.name, true, false, varCreateResponse);
                    }
                    else {
                        // var existed as an expression before. Now it's a variable too.
                        varobj = yield varMgr.updateVar(this.gdb, frame.frameId, frame.threadId, depth, varobj);
                        varobj.isVar = true;
                    }
                    let value = varobj.value;
                    // if we have an array parent entry, we need to display the address.
                    if (arrayRegex.test(varobj.type)) {
                        value = yield this.getAddr(varobj);
                    }
                    variables.push({
                        name: varobj.expression,
                        value,
                        type: varobj.type,
                        variablesReference: parseInt(varobj.numchild, 10) > 0
                            ? this.variableHandles.create({
                                type: 'object',
                                frameHandle: ref.frameHandle,
                                varobjName: varobj.varname,
                            })
                            : 0,
                    });
                }
            }
            return Promise.resolve(variables);
        });
    }
    handleVariableRequestObject(ref) {
        return __awaiter(this, void 0, void 0, function* () {
            // initialize variables array and dereference the frame handle
            const variables = [];
            const frame = this.frameHandles.get(ref.frameHandle);
            if (!frame) {
                return Promise.resolve(variables);
            }
            // fetch stack depth to obtain frameId/threadId/depth tuple
            const stackDepth = yield mi.sendStackInfoDepth(this.gdb, { maxDepth: 100 });
            const depth = parseInt(stackDepth.depth, 10);
            // we need to keep track of children and the parent varname in GDB
            let children;
            let parentVarname = ref.varobjName;
            // if a varobj exists, use the varname stored there
            const varobj = varMgr.getVarByName(frame.frameId, frame.threadId, depth, ref.varobjName);
            if (varobj) {
                children = yield mi.sendVarListChildren(this.gdb, {
                    name: varobj.varname,
                    printValues: 'all-values',
                });
                parentVarname = varobj.varname;
            }
            else {
                // otherwise use the parent name passed in the variable reference
                children = yield mi.sendVarListChildren(this.gdb, {
                    name: ref.varobjName,
                    printValues: 'all-values',
                });
            }
            // iterate through the children
            for (const child of children.children) {
                // check if we're dealing with a C++ object. If we are, we need to fetch the grandchildren instead.
                const isClass = this.isChildOfClass(child);
                if (isClass) {
                    const name = `${parentVarname}.${child.exp}`;
                    const objChildren = yield mi.sendVarListChildren(this.gdb, {
                        name,
                        printValues: 'all-values',
                    });
                    for (const objChild of objChildren.children) {
                        const childName = `${name}.${objChild.exp}`;
                        variables.push({
                            name: objChild.exp,
                            value: objChild.value ? objChild.value : objChild.type,
                            type: objChild.type,
                            variablesReference: parseInt(objChild.numchild, 10) > 0
                                ? this.variableHandles.create({
                                    type: 'object',
                                    frameHandle: ref.frameHandle,
                                    varobjName: childName,
                                })
                                : 0,
                        });
                    }
                }
                else {
                    // check if we're dealing with an array
                    let name = `${ref.varobjName}.${child.exp}`;
                    let varobjName = name;
                    let value = child.value ? child.value : child.type;
                    const isArrayParent = arrayRegex.test(child.type);
                    const isArrayChild = (varobj !== undefined
                        ? arrayRegex.test(varobj.type) && arrayChildRegex.test(child.exp)
                        : false);
                    if (isArrayChild) {
                        // update the display name for array elements to have square brackets
                        name = `[${child.exp}]`;
                    }
                    if (isArrayParent || isArrayChild) {
                        // can't use a relative varname (eg. var1.a.b.c) to create/update a new var so fetch and track these
                        // vars by evaluating their path expression from GDB
                        const exprResponse = yield mi.sendVarInfoPathExpression(this.gdb, child.name);
                        // create or update the var in GDB
                        let arrobj = varMgr.getVar(frame.frameId, frame.threadId, depth, exprResponse.path_expr);
                        if (!arrobj) {
                            const varCreateResponse = yield mi.sendVarCreate(this.gdb, {
                                frame: 'current', expression: exprResponse.path_expr,
                            });
                            arrobj = varMgr.addVar(frame.frameId, frame.threadId, depth, exprResponse.path_expr, true, false, varCreateResponse);
                        }
                        else {
                            arrobj = yield varMgr.updateVar(this.gdb, frame.frameId, frame.threadId, depth, arrobj);
                        }
                        // if we have an array parent entry, we need to display the address.
                        if (isArrayParent) {
                            value = yield this.getAddr(arrobj);
                        }
                        arrobj.isChild = true;
                        varobjName = arrobj.varname;
                    }
                    const variableName = isArrayChild ? name : child.exp;
                    variables.push({
                        name: variableName,
                        value,
                        type: child.type,
                        variablesReference: parseInt(child.numchild, 10) > 0
                            ? this.variableHandles.create({
                                type: 'object',
                                frameHandle: ref.frameHandle,
                                varobjName,
                            })
                            : 0,
                    });
                }
            }
            return Promise.resolve(variables);
        });
    }
    getAddr(varobj) {
        return __awaiter(this, void 0, void 0, function* () {
            const addr = yield mi.sendDataEvaluateExpression(this.gdb, `&(${varobj.expression})`);
            return addr.value ? addr.value : varobj.value;
        });
    }
    isChildOfClass(child) {
        return child.type === undefined && child.value === '' &&
            (child.exp === 'public' || child.exp === 'protected' || child.exp === 'private');
    }
}
exports.GDBDebugSession = GDBDebugSession;
//# sourceMappingURL=GDBDebugSession.js.map