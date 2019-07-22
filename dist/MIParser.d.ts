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
    protected gdb: GDBBackend;
    protected line: string;
    protected pos: number;
    protected commandQueue: any;
    protected waitReady?: (value?: void | PromiseLike<void>) => void;
    constructor(gdb: GDBBackend);
    parse(stream: Readable): Promise<void>;
    queueCommand(token: number, command: (resultClass: string, resultData: any) => void): void;
    protected next(): string | null;
    protected back(): void;
    protected restOfLine(): string;
    protected handleToken(firstChar: string): string;
    protected handleCString(): string | null;
    protected handleString(): string;
    protected handleObject(): any;
    protected handleArray(): any[] | null;
    protected handleValue(): any;
    protected handleAsyncData(): any;
    protected handleConsoleStream(): void;
    protected handleLogStream(): void;
    protected handleLine(): void;
}
