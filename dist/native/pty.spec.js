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
 * Copyright (c) 2019 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
const chai_1 = require("chai");
const fs = require("fs");
const os = require("os");
const stream_1 = require("stream");
const pty_1 = require("../native/pty");
// Allow non-arrow functions: https://mochajs.org/#arrow-functions
// tslint:disable:only-arrow-functions no-console no-bitwise
if (os.platform() !== 'win32') {
    describe('pty creation', function () {
        let master;
        let slave;
        afterEach(function () {
            if (slave) {
                slave.destroy();
            }
            if (master) {
                master.destroy();
            }
        });
        it('should be able to open a ptmx/pts pair', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const pty = new pty_1.Pty();
                master = pty.master;
                slave = new File(fs.openSync(pty.name, 'r+'));
                function onError(error) {
                    console.error(error);
                    throw error;
                }
                master.on('error', onError);
                slave.on('error', onError);
                let masterStream = '';
                let slaveStream = '';
                master.on('data', (data) => masterStream += data.toString('utf8'));
                slave.on('data', (data) => slaveStream += data.toString('utf8'));
                chai_1.expect(masterStream).eq('');
                chai_1.expect(slaveStream).eq('');
                yield sendAndAwait('master2slave', master, slave);
                chai_1.expect(masterStream).eq('');
                chai_1.expect(slaveStream).eq('master2slave');
                yield sendAndAwait('slave2master', slave, master);
                chai_1.expect(masterStream).eq('slave2master');
                chai_1.expect(slaveStream).eq('master2slave');
            });
        });
    });
    /**
     * Assumes that we are the only one writing to
     * @param str
     * @param writeTo
     * @param readFrom
     */
    function sendAndAwait(str, writeTo, readFrom) {
        return new Promise((resolve) => {
            readFrom.once('data', () => resolve());
            writeTo.write(str);
        });
    }
    class File extends stream_1.Duplex {
        constructor(fd, bufferSize = File.DEFAULT_BUFFER_SIZE) {
            super();
            this.fd = fd;
            this.destroyed = false;
            this.buffer = Buffer.alloc(Math.max(bufferSize, File.MIN_BUFFER_SIZE));
        }
        _write(str, encoding, callback) {
            fs.write(this.fd, Buffer.from(str, encoding), callback);
        }
        _read(size) {
            fs.read(this.fd, this.buffer, 0, Math.min(this.buffer.length, size), null, (error, bytesRead, readBuffer) => {
                if (error) {
                    if (this.destroyed) {
                        return;
                    }
                    throw error;
                }
                this.push(readBuffer.slice(0, bytesRead));
            });
        }
        _destroy(error, callback) {
            this.destroyed = true;
            if (error) {
                throw error;
            }
            if (callback) {
                fs.close(this.fd, callback);
            }
        }
    }
    File.MIN_BUFFER_SIZE = 1 << 10;
    File.DEFAULT_BUFFER_SIZE = 1 << 16;
}
//# sourceMappingURL=pty.spec.js.map