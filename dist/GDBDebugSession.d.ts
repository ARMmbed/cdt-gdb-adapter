import { Handles, Logger, LoggingDebugSession, Response, Thread } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { GDBBackend } from './GDBBackend';
import * as mi from './mi';
import * as varMgr from './varManager';
export interface RequestArguments extends DebugProtocol.LaunchRequestArguments {
    gdb?: string;
    gdbArguments?: string[];
    program: string;
    verbose?: boolean;
    logFile?: string;
    openGdbConsole?: boolean;
    initCommands?: string[];
}
export interface LaunchRequestArguments extends RequestArguments {
    arguments?: string;
}
export interface AttachRequestArguments extends RequestArguments {
    processId: string;
}
export interface FrameReference {
    threadId: number;
    frameId: number;
}
export interface FrameVariableReference {
    type: 'frame';
    frameHandle: number;
}
export interface ObjectVariableReference {
    type: 'object';
    frameHandle: number;
    varobjName: string;
}
export declare type VariableReference = FrameVariableReference | ObjectVariableReference;
export interface MemoryRequestArguments {
    address: string;
    length: number;
    offset?: number;
}
/**
 * Response for our custom 'cdt-gdb-adapter/Memory' request.
 */
export interface MemoryContents {
    data: string;
    address: string;
}
export interface MemoryResponse extends Response {
    body: MemoryContents;
}
export declare class GDBDebugSession extends LoggingDebugSession {
    protected gdb: GDBBackend;
    protected isAttach: boolean;
    protected isRunning: boolean;
    protected supportsRunInTerminalRequest: boolean;
    protected supportsGdbConsole: boolean;
    protected logger: Logger.Logger;
    protected frameHandles: Handles<FrameReference>;
    protected variableHandles: Handles<VariableReference>;
    protected threads: Thread[];
    protected waitPaused?: (value?: void | PromiseLike<void>) => void;
    constructor();
    protected createBackend(): GDBBackend;
    /**
     * Handle requests not defined in the debug adapter protocol.
     */
    protected customRequest(command: string, response: DebugProtocol.Response, args: any): void;
    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void;
    protected attachRequest(response: DebugProtocol.AttachResponse, args: AttachRequestArguments): Promise<void>;
    protected launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments): Promise<void>;
    protected spawn(args: LaunchRequestArguments | AttachRequestArguments): Promise<void>;
    protected spawnInClientTerminal(args: DebugProtocol.LaunchRequestArguments | DebugProtocol.AttachRequestArguments): Promise<void>;
    protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): Promise<void>;
    protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): Promise<void>;
    protected convertThread(thread: mi.MIThreadInfo): Thread;
    protected threadsRequest(response: DebugProtocol.ThreadsResponse): Promise<void>;
    protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): Promise<void>;
    protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): Promise<void>;
    protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments): Promise<void>;
    protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments): Promise<void>;
    protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): Promise<void>;
    protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments): Promise<void>;
    protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments): void;
    protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments): Promise<void>;
    protected setVariableRequest(response: DebugProtocol.SetVariableResponse, args: DebugProtocol.SetVariableArguments): Promise<void>;
    protected evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): Promise<void>;
    /**
     * Implement the cdt-gdb-adapter/Memory request.
     */
    protected memoryRequest(response: MemoryResponse, args: any): Promise<void>;
    protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments): Promise<void>;
    protected sendStoppedEvent(reason: string, threadId: number, exceptionText?: string): void;
    protected handleGDBStopped(result: any): void;
    protected handleGDBAsync(resultClass: string, resultData: any): void;
    protected handleGDBNotify(notifyClass: string, notifyData: any): void;
    protected handleVariableRequestFrame(ref: FrameVariableReference): Promise<DebugProtocol.Variable[]>;
    protected handleVariableRequestObject(ref: ObjectVariableReference): Promise<DebugProtocol.Variable[]>;
    protected getAddr(varobj: varMgr.VarObjType): Promise<string>;
    protected isChildOfClass(child: mi.MIVarChild): boolean;
}
