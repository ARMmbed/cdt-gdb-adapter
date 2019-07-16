/// <reference types="node" />
/*********************************************************************
 * Copyright (c) 2018 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import { Readable } from 'stream';
import { GDBBackend } from './GDBBackend';
export declare class MIParser {
    private gdb;
    private line;
    private pos;
    private commandQueue;
    private waitReady?;
    constructor(gdb: GDBBackend);
    parse(stream: Readable): Promise<void>;
    queueCommand(token: number, command: (resultClass: string, resultData: any) => void): void;
    private next;
    private back;
    private restOfLine;
    private handleToken;
    private handleCString;
    private handleString;
    private handleObject;
    private handleArray;
    private handleValue;
    private handleAsyncData;
    private handleConsoleStream;
    private handleLogStream;
    private handleLine;
}
