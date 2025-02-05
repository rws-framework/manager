import { CompilerOptions, TypeAcquisition } from "typescript";
import { Pathkeeper } from '../helper/TSConfigHelper';

export interface UserCompilerOptions extends Omit<CompilerOptions, 'target' | 'module' | 'moduleResolution'> {
    target: string
    module: string
    moduleResolution: string
    paths: {[pathRegex: string] : string[]}
}

export interface TSConfigContent {
    extends?: string;
    compilerOptions: UserCompilerOptions;
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
    tsConfig(pkgPath: string, fileCreation?: boolean, isToRemove?: boolean): Promise<TSConfigData>
    remove(): void
}

export interface PackageJson { 
    dependencies?: {[packageName: string] : string}, 
    devDependencies?: {[packageName: string] : string} 
    _rws?: boolean
}