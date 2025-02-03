import { CompilerOptions, TypeAcquisition } from "typescript";

export interface TSConfigContent {
    extends?: string;
    compilerOptions: CompilerOptions;
    include?: string[];
    exclude?: string[];
    files?: string[];
    references?: Array<{ path: string }>;
    typeAcquisition?: TypeAcquisition;    
}