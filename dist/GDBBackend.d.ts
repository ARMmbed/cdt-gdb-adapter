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
import { ChildProcess } from 'child_process';
import * as events from 'events';
import { Writable } from 'stream';
import { AttachRequestArguments, LaunchRequestArguments } from './GDBDebugSession';
import { MIResponse } from './mi';
import { MIParser } from './MIParser';
export interface MIExecNextRequest {
    reverse?: boolean;
}
export interface MIExecNextResponse extends MIResponse {
}
export interface MIGDBShowResponse extends MIResponse {
    value?: string;
}
export declare interface GDBBackend {
    on(event: 'consoleStreamOutput', listener: (output: string, category: string) => void): this;
    on(event: 'execAsync' | 'notifyAsync', listener: (asyncClass: string, data: any) => void): this;
    emit(event: 'consoleStreamOutput', output: string, category: string): boolean;
    emit(event: 'execAsync' | 'notifyAsync', asyncClass: string, data: any): boolean;
}
export declare class GDBBackend extends events.EventEmitter {
    protected parser: MIParser;
    protected out?: Writable;
    protected token: number;
    protected proc?: ChildProcess;
    spawn(requestArgs: LaunchRequestArguments | AttachRequestArguments): Promise<void>;
    spawnInClientTerminal(requestArgs: LaunchRequestArguments | AttachRequestArguments, cb: (args: string[]) => Promise<void>): Promise<void>;
    pause(): boolean;
    supportsNewUi(gdbPath?: string): Promise<boolean>;
    sendCommand<T>(command: string): Promise<T>;
    sendEnablePrettyPrint(): Promise<{}>;
    sendFileExecAndSymbols(program: string): Promise<{}>;
    sendGDBSet(params: string): Promise<{}>;
    sendGDBShow(params: string): Promise<MIGDBShowResponse>;
    sendGDBExit(): Promise<{}>;
    protected nextToken(): number;
}
