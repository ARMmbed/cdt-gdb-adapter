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
export declare function sendExecArguments(gdb: GDBBackend, params: {
    arguments: string;
}): Promise<MIResponse>;
export declare function sendExecRun(gdb: GDBBackend): Promise<{}>;
export declare function sendExecContinue(gdb: GDBBackend, threadId?: number): Promise<{}>;
export declare function sendExecNext(gdb: GDBBackend, threadId?: number): Promise<{}>;
export declare function sendExecStep(gdb: GDBBackend, threadId?: number): Promise<{}>;
export declare function sendExecFinish(gdb: GDBBackend, threadId?: number): Promise<{}>;
