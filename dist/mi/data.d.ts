/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import { GDBBackend } from '../GDBBackend';
import { MIResponse } from './base';
interface MIDataReadMemoryBytesResponse {
    memory: Array<{
        begin: string;
        end: string;
        offset: string;
        contents: string;
    }>;
}
export interface MIGDBDataEvaluateExpressionResponse extends MIResponse {
    value?: string;
}
export declare function sendDataReadMemoryBytes(gdb: GDBBackend, address: string, size: number, offset?: number): Promise<MIDataReadMemoryBytesResponse>;
export declare function sendDataEvaluateExpression(gdb: GDBBackend, expr: string): Promise<MIGDBDataEvaluateExpressionResponse>;
export {};
