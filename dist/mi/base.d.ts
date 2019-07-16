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
export interface MIResponse {
    _class: string;
}
export declare abstract class MIRequest<R> {
    abstract send(backend: GDBBackend): Promise<R>;
}
export interface MIBreakpointInfo {
    number: string;
    type: string;
    disp: string;
    enabled: string;
    addr?: string;
    func?: string;
    file?: string;
    fullname?: string;
    line?: string;
    threadGroups: string[];
    times: string;
    originalLocation?: string;
    cond?: string;
}
export interface MIFrameInfo {
    level: string;
    func?: string;
    addr?: string;
    file?: string;
    fullname?: string;
    line?: string;
    from?: string;
}
export interface MIVariableInfo {
    name: string;
    value?: string;
    type?: string;
}
