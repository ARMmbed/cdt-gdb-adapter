import { DebugClient } from 'vscode-debugadapter-testsupport';
import { DebugProtocol } from 'vscode-debugprotocol';
export declare type ReverseRequestHandler<A = any, R extends DebugProtocol.Response = DebugProtocol.Response> = (args: A) => Promise<R['body']>;
export interface ReverseRequestHandlers {
    [key: string]: ReverseRequestHandler | undefined;
    runInTerminal: ReverseRequestHandler<DebugProtocol.RunInTerminalRequestArguments, DebugProtocol.RunInTerminalResponse>;
}
/**
 * Extend the DebugClient to support Reverse Requests:
 * https://microsoft.github.io/debug-adapter-protocol/specification#Reverse_Requests_RunInTerminal
 */
export declare class CdtDebugClient extends DebugClient {
    /**
     * Reverse Request Handlers:
     */
    protected reverseRequestHandlers: ReverseRequestHandlers;
    /**
     * Notify the Debug Adapter by default that this client supports `runInTerminal`.
     */
    initializeRequest(args?: DebugProtocol.InitializeRequestArguments): Promise<DebugProtocol.InitializeResponse>;
    /**
     * Send a response following a Debug Adapter Reverse Request.
     * @param request original request to respond to.
     * @param handler processes the request and returns the response body.
     */
    private doRespond;
}
