/*********************************************************************
 * Copyright (c) 2019 Kichwa Coders and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
/// <reference types="node" />
import { GDBDebugSession, RequestArguments } from './GDBDebugSession';
import { DebugProtocol } from 'vscode-debugprotocol';
import { ChildProcess } from 'child_process';
export interface TargetAttachArguments {
    type?: string;
    parameters?: string[];
    host?: string;
    port?: string;
    connectCommands?: string[];
}
export interface TargetLaunchArguments extends TargetAttachArguments {
    server?: string;
    serverParameters?: string[];
    serverPortRegExp?: string;
    serverStartupDelay?: number;
}
export interface ImageAndSymbolArguments {
    symbolFileName?: string;
    symbolOffset?: string;
    imageFileName?: string;
    imageOffset?: string;
}
export interface TargetAttachRequestArguments extends RequestArguments {
    target?: TargetAttachArguments;
    imageAndSymbols?: ImageAndSymbolArguments;
    preRunCommands?: string[];
}
export interface TargetLaunchRequestArguments extends TargetAttachRequestArguments {
    target?: TargetLaunchArguments;
    imageAndSymbols?: ImageAndSymbolArguments;
    preRunCommands?: string[];
}
export declare class GDBTargetDebugSession extends GDBDebugSession {
    protected gdbserver?: ChildProcess;
    protected launchRequest(response: DebugProtocol.LaunchResponse, args: TargetLaunchRequestArguments): Promise<void>;
    protected attachRequest(response: DebugProtocol.AttachResponse, args: TargetAttachRequestArguments): Promise<void>;
    protected setupCommonLoggerAndHandlers(args: TargetLaunchRequestArguments): void;
    protected startGDBServer(args: TargetLaunchRequestArguments): Promise<void>;
    protected startGDBAndAttachToTarget(response: DebugProtocol.AttachResponse | DebugProtocol.LaunchResponse, args: TargetAttachRequestArguments): Promise<void>;
}
