import { GDBBackend } from './GDBBackend';
import { MIVarCreateResponse } from './mi/var';
export interface VarObjType {
    varname: string;
    expression: string;
    numchild: string;
    children: VarObjType[];
    value: string;
    type: string;
    isVar: boolean;
    isChild: boolean;
}
export declare function getKey(frameId: number, threadId: number, depth: number): string;
export declare function getVars(frameId: number, threadId: number, depth: number): VarObjType[] | undefined;
export declare function getVar(frameId: number, threadId: number, depth: number, expression: string): VarObjType | undefined;
export declare function getVarByName(frameId: number, threadId: number, depth: number, varname: string): VarObjType | undefined;
export declare function addVar(frameId: number, threadId: number, depth: number, expression: string, isVar: boolean, isChild: boolean, varCreateResponse: MIVarCreateResponse): VarObjType;
export declare function removeVar(gdb: GDBBackend, frameId: number, threadId: number, depth: number, varname: string): Promise<void>;
export declare function updateVar(gdb: GDBBackend, frameId: number, threadId: number, depth: number, varobj: VarObjType): Promise<VarObjType>;
