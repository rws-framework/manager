import { CompilerOptions, TypeAcquisition } from "typescript";
import { Pathkeeper } from '../helper/TSConfigHelper';

export interface TSConfigContent {
    extends?: string;
    compilerOptions: CompilerOptions;
    include?: string[];
    exclude?: string[];
    files?: string[];
    references?: Array<{ path: string }>;
    typeAcquisition?: TypeAcquisition;    
}

export interface TSConfigData {
    config: TSConfigContent
    path: string
    fileName: string
    fileCreated: boolean
    includes: Pathkeeper[]
    excludes: Pathkeeper[]    
}

export interface TSConfigControls {
    isToRemove: boolean;
    tsConfig(pkgPath: string, fileCreation?: boolean, isToRemove?: boolean): TSConfigData
    remove(): void
}

export interface PackageJson { 
    dependencies?: {[packageName: string] : string}, 
    devDependencies?: {[packageName: string] : string} 
    _rws?: boolean
}