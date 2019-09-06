"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("vscode-debugadapter/lib/logger");
class MIParser {
    constructor(gdb) {
        this.gdb = gdb;
        this.line = '';
        this.pos = 0;
        this.commandQueue = {};
    }
    parse(stream) {
        return new Promise((resolve) => {
            this.waitReady = resolve;
            const lineRegex = /(.*)(\r?\n)/;
            let buff = '';
            stream.on('data', (chunk) => {
                buff += chunk.toString();
                let regexArray = lineRegex.exec(buff);
                while (regexArray) {
                    this.line = regexArray[1];
                    this.pos = 0;
                    this.handleLine();
                    buff = buff.substring(regexArray[1].length + regexArray[2].length);
                    regexArray = lineRegex.exec(buff);
                }
            });
        });
    }
    queueCommand(token, command) {
        this.commandQueue[token] = command;
    }
    next() {
        if (this.pos < this.line.length) {
            return this.line[this.pos++];
        }
        else {
            return null;
        }
    }
    back() {
        this.pos--;
    }
    restOfLine() {
        return this.line.substr(this.pos);
    }
    handleToken(firstChar) {
        let token = firstChar;
        let c = this.next();
        while (c && c >= '0' && c <= '9') {
            token += c;
            c = this.next();
        }
        this.back();
        return token;
    }
    handleCString() {
        let c = this.next();
        if (!c || c !== '"') {
            return null;
        }
        let cstring = '';
        for (c = this.next(); c; c = this.next()) {
            switch (c) {
                case '"':
                    return cstring;
                case '\\':
                    c = this.next();
                    if (c) {
                        switch (c) {
                            case 'n':
                                cstring += '\n';
                                break;
                            case 't':
                                cstring += '\t';
                                break;
                            case 'r':
                                break;
                            default:
                                cstring += c;
                        }
                    }
                    else {
                        this.back();
                    }
                    break;
                default:
                    cstring += c;
            }
        }
        return cstring;
    }
    handleString() {
        let str = '';
        for (let c = this.next(); c; c = this.next()) {
            if (c === '=' || c === ',') {
                this.back();
                return str;
            }
            else {
                str += c;
            }
        }
        return str;
    }
    handleObject() {
        let c = this.next();
        const result = {};
        if (c === '{') {
            c = this.next();
            while (c !== '}') {
                if (c !== ',') {
                    this.back();
                }
                const name = this.handleString();
                if (this.next() === '=') {
                    result[name] = this.handleValue();
                }
                c = this.next();
            }
        }
        if (c === '}') {
            return result;
        }
        else {
            return null;
        }
    }
    handleArray() {
        let c = this.next();
        const result = [];
        if (c === '[') {
            c = this.next();
            while (c !== ']') {
                if (c !== ',') {
                    this.back();
                }
                result.push(this.handleValue());
                c = this.next();
            }
        }
        if (c === ']') {
            return result;
        }
        else {
            return null;
        }
    }
    handleValue() {
        const c = this.next();
        this.back();
        switch (c) {
            case '"':
                return this.handleCString();
            case '{':
                return this.handleObject();
            case '[':
                return this.handleArray();
            default:
                // A weird array element with a name, ignore the name and return the value
                this.handleString();
                if (this.next() === '=') {
                    return this.handleValue();
                }
        }
        return null;
    }
    handleAsyncData() {
        const result = {};
        let c = this.next();
        while (c === ',') {
            const name = this.handleString();
            if (this.next() === '=') {
                result[name] = this.handleValue();
            }
            c = this.next();
        }
        return result;
    }
    handleConsoleStream() {
        const msg = this.handleCString();
        if (msg) {
            this.gdb.emit('consoleStreamOutput', msg, 'stdout');
        }
    }
    handleLogStream() {
        const msg = this.handleCString();
        if (msg) {
            logger_1.logger.log(msg);
        }
    }
    handleLine() {
        let c = this.next();
        if (!c) {
            return;
        }
        let token = '';
        if (c >= '0' && c <= '9') {
            token = this.handleToken(c);
            c = this.next();
        }
        switch (c) {
            case '^':
                logger_1.logger.verbose(`GDB result: ${token} ${this.restOfLine()}`);
                const command = this.commandQueue[token];
                if (command) {
                    const resultClass = this.handleString();
                    const resultData = this.handleAsyncData();
                    command(resultClass, resultData);
                    delete this.commandQueue[token];
                }
                else {
                    logger_1.logger.error('GDB response with no command: ' + token);
                }
                break;
            case '~':
            case '@':
                this.handleConsoleStream();
                break;
            case '&':
                this.handleLogStream();
                break;
            case '=':
                logger_1.logger.verbose('GDB notify async: ' + this.restOfLine());
                const notifyClass = this.handleString();
                this.gdb.emit('notifyAsync', notifyClass, this.handleAsyncData());
                break;
            case '*':
                logger_1.logger.verbose('GDB exec async: ' + this.restOfLine());
                const execClass = this.handleString();
                this.gdb.emit('execAsync', execClass, this.handleAsyncData());
                break;
            case '+':
                logger_1.logger.verbose('GDB status async: ' + this.restOfLine());
                const statusClass = this.handleString();
                this.gdb.emit('statusAsync', statusClass, this.handleAsyncData());
                break;
            case '(':
                if (this.waitReady) {
                    this.waitReady();
                    this.waitReady = undefined;
                }
                break;
            default:
                // treat as console output. happens on Windows.
                this.back();
                this.gdb.emit('consoleStreamOutput', this.restOfLine() + '\n', 'stdout');
        }
    }
}
exports.MIParser = MIParser;
//# sourceMappingURL=MIParser.js.map