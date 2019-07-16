/*********************************************************************
 * Copyright (c) 2018 QNX Software Systems and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import { GDBBackend } from '../GDBBackend';
import { MIFrameInfo, MIResponse, MIVariableInfo } from './base';
export interface MIStackInfoDepthResponse extends MIResponse {
    depth: string;
}
export interface MIStackListVariablesResponse extends MIResponse {
    variables: MIVariableInfo[];
}
export declare function sendStackInfoDepth(gdb: GDBBackend, params: {
    maxDepth: number;
}): Promise<MIStackInfoDepthResponse>;
export declare function sendStackListFramesRequest(gdb: GDBBackend, params: {
    noFrameFilters?: boolean;
    lowFrame?: number;
    highFrame?: number;
}): Promise<{
    stack: MIFrameInfo[];
}>;
export declare function sendStackSelectFrame(gdb: GDBBackend, params: {
    framenum: number;
}): Promise<MIResponse>;
export declare function sendStackListVariables(gdb: GDBBackend, params: {
    thread?: number;
    frame?: number;
    printValues: 'no-values' | 'all-values' | 'simple-values';
    noFrameFilters?: boolean;
    skipUnavailable?: boolean;
}): Promise<MIStackListVariablesResponse>;
