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
import { MIResponse } from './base';
export interface MIVarCreateResponse extends MIResponse {
    name: string;
    numchild: string;
    value: string;
    type: string;
    'thread-id'?: string;
    has_more?: string;
    dynamic?: string;
    displayhint?: string;
}
export interface MIVarListChildrenResponse {
    numchild: string;
    children: MIVarChild[];
}
export interface MIVarChild {
    name: string;
    exp: string;
    numchild: string;
    type: string;
    value?: string;
    'thread-id'?: string;
    frozen?: string;
    displayhint?: string;
    dynamic?: string;
}
export interface MIVarUpdateResponse {
    changelist: Array<{
        name: string;
        value: string;
        in_scope: string;
        type_changed: string;
        has_more: string;
    }>;
}
export interface MIVarEvalResponse {
    value: string;
}
export interface MIVarAssignResponse {
    value: string;
}
export interface MIVarPathInfoResponse {
    path_expr: string;
}
export declare function sendVarCreate(gdb: GDBBackend, params: {
    name?: string;
    frameAddr?: string;
    frame?: 'current' | 'floating';
    expression: string;
}): Promise<MIVarCreateResponse>;
export declare function sendVarListChildren(gdb: GDBBackend, params: {
    printValues?: 'no-values' | 'all-values' | 'simple-values';
    name: string;
    from?: number;
    to?: number;
}): Promise<MIVarListChildrenResponse>;
export declare function sendVarUpdate(gdb: GDBBackend, params: {
    threadId?: number;
    name?: string;
}): Promise<MIVarUpdateResponse>;
export declare function sendVarDelete(gdb: GDBBackend, params: {
    varname: string;
}): Promise<void>;
export declare function sendVarAssign(gdb: GDBBackend, params: {
    varname: string;
    expression: string;
}): Promise<MIVarAssignResponse>;
export declare function sendVarEvaluateExpression(gdb: GDBBackend, params: {
    varname: string;
}): Promise<MIVarEvalResponse>;
export declare function sendVarInfoPathExpression(gdb: GDBBackend, name: string): Promise<MIVarPathInfoResponse>;
