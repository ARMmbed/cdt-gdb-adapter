/*********************************************************************
 * Copyright (c) 2018 Ericsson and others
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *********************************************************************/
import { DebugProtocol } from 'vscode-debugprotocol';
import { CdtDebugClient } from './debugClient';
export interface Scope {
    threadId: number;
    frameId: number;
    scopes: DebugProtocol.ScopesResponse;
}
export declare function getScopes(dc: CdtDebugClient, threadIndex?: number, stackIndex?: number): Promise<Scope>;
/**
 * Wrap `promise` in a new Promise that resolves if `promise` is rejected, and is rejected if `promise` is resolved.
 *
 * This is useful when we expect `promise` to be reject and want to test that it is indeed the case.
 */
export declare function expectRejection<T>(promise: Promise<T>): Promise<Error>;
/**
 * Test a given variable returned from a variablesRequest against an expected name, type, and/or value.
 */
export declare function verifyVariable(variable: DebugProtocol.Variable, expectedName: string, expectedType?: string, expectedValue?: string, hasChildren?: boolean): void;
export declare function compareVariable(varA: DebugProtocol.Variable, varB: DebugProtocol.Variable, namesMatch: boolean, typesMatch: boolean, valuesMatch: boolean): void;
export declare const testProgramsDir: string;
export declare function standardBeforeEach(adapter?: string): Promise<CdtDebugClient>;
export declare const openGdbConsole: boolean;
export declare const gdbPath: string | undefined;
export declare const gdbServerPath: string;
export declare const debugServerPort: number | undefined;
export declare const defaultAdapter: string;
export interface LineTags {
    [key: string]: number;
}
/**
 * Find locations of tags in `sourceFile`.
 *
 * Instead of referring to source line numbers of test programs directly,
 * tests should place tags (usually some comments) in the source files.  This
 * function finds the line number correspnding to each tag in `tags`.
 *
 * This function throws if a tag is found more than once or is not found.
 *
 * @param tags An object where keys are the tags to find, and values are 0.
 *             This function will modify the object in place to full the values
 *             with line number.
 */
export declare function resolveLineTagLocations(sourceFile: string, tags: LineTags): void;
