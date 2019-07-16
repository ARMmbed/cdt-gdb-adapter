/// <reference types="node" />
import * as events from 'events';
import { AttachRequestArguments, LaunchRequestArguments } from './GDBDebugSession';
import { MIResponse } from './mi';
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
    private parser;
    private out?;
    private token;
    private proc?;
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
    private nextToken;
}
