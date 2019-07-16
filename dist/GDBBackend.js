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
const child_process_1 = require("child_process");
const events = require("events");
const logger_1 = require("vscode-debugadapter/lib/logger");
const MIParser_1 = require("./MIParser");
class GDBBackend extends events.EventEmitter {
    constructor() {
        super(...arguments);
        this.parser = new MIParser_1.MIParser(this);
        this.token = 0;
    }
    spawn(requestArgs) {
        const gdb = requestArgs.gdb ? requestArgs.gdb : 'gdb';
        let args = ['--interpreter=mi2'];
        if (requestArgs.gdbArguments) {
            args = args.concat(requestArgs.gdbArguments);
        }
        this.proc = child_process_1.spawn(gdb, args);
        this.out = this.proc.stdin;
        return this.parser.parse(this.proc.stdout);
    }
    spawnInClientTerminal(requestArgs, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const gdb = requestArgs.gdb ? requestArgs.gdb : 'gdb';
            // Use dynamic import to remove need for natively building this adapter
            // Useful when 'spawnInClientTerminal' isn't needed, but adapter is distributed on multiple OS's
            const { Pty } = yield Promise.resolve().then(() => require('./native/pty'));
            const pty = new Pty();
            let args = [gdb, '-ex', `new-ui mi2 ${pty.name}`];
            if (requestArgs.gdbArguments) {
                args = args.concat(requestArgs.gdbArguments);
            }
            yield cb(args);
            this.out = pty.master;
            return this.parser.parse(pty.master);
        });
    }
    pause() {
        if (this.proc) {
            this.proc.kill('SIGINT');
            return true;
        }
        else {
            return false;
        }
    }
    supportsNewUi(gdbPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const gdb = gdbPath || 'gdb';
            return new Promise((resolve, reject) => {
                child_process_1.execFile(gdb, ['-nx', '-batch', '-ex', 'new-ui'], (error, stdout, stderr) => {
                    // - gdb > 8.2 outputs 'Usage: new-ui INTERPRETER TTY'
                    // - gdb 7.12 to 8.2 outputs 'usage: new-ui <interpreter> <tty>'
                    // - gdb < 7.12 doesn't support the new-ui command, and outputs
                    //   'Undefined command: "new-ui".  Try "help".'
                    resolve(/^usage: new-ui/im.test(stderr));
                });
            });
        });
    }
    sendCommand(command) {
        const token = this.nextToken();
        logger_1.logger.verbose(`GDB command: ${token} ${command}`);
        return new Promise((resolve, reject) => {
            if (this.out) {
                this.parser.queueCommand(token, (resultClass, resultData) => {
                    switch (resultClass) {
                        case 'done':
                        case 'running':
                        case 'connected':
                        case 'exit':
                            resolve(resultData);
                            break;
                        case 'error':
                            reject(new Error(resultData.msg));
                            break;
                        default:
                            reject(new Error(`Unknown response ${resultClass}: ${JSON.stringify(resultData)}`));
                    }
                });
                this.out.write(`${token}${command}\n`);
            }
            else {
                reject(new Error('gdb is not running.'));
            }
        });
    }
    sendEnablePrettyPrint() {
        return this.sendCommand('-enable-pretty-printing');
    }
    sendFileExecAndSymbols(program) {
        return this.sendCommand(`-file-exec-and-symbols ${program}`);
    }
    sendGDBSet(params) {
        return this.sendCommand(`-gdb-set ${params}`);
    }
    sendGDBShow(params) {
        return this.sendCommand(`-gdb-show ${params}`);
    }
    sendGDBExit() {
        return this.sendCommand('-gdb-exit');
    }
    nextToken() {
        return this.token++;
    }
}
exports.GDBBackend = GDBBackend;
//# sourceMappingURL=GDBBackend.js.map