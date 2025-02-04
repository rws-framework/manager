import fs, { link } from 'fs';
import path from 'path';
import { ConfigHelper } from './ConfigHelper';
import { BuildType } from '../types/run';
import Singleton from './_singleton';
import { ScriptTarget, ModuleKind } from 'typescript';
import { TSConfigContent } from '../types/tsc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { rwsPath } from '@rws-framework/console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

class Pathkeeper {
    constructor(private basePath: string, private filePath: string){};

    rel(): string
    {
        return path.relative(this.basePath, this.filePath);
    }

    abs(): string
    {
        return path.resolve(this.basePath, this.filePath);
    }

    toString(): string {
        return this.abs();
    }

    valueOf(): string {
        return this.abs();
    }

    length(): number {
        return this.abs().length;
    }
}

export class TSConfigHelper extends Singleton {
    static tsFileName: string = '.rws.tsconfig.json';

    build(        
        appRootPath: string,            
        cfg: ConfigHelper,
        buildType: Exclude<BuildType, BuildType.ALL>
    ): TSConfigControls  {
        const buildSection = cfg.getBuildTypeSection(buildType);
        const wrkDir = path.join(appRootPath, buildSection.workspaceDir);
        const tsPath = path.join(wrkDir, TSConfigHelper.tsFileName);

        const _self = this;
        

        const controlSet: Partial<TSConfigControls> =  {
            isToRemove: false                        
        }      

        function tsConfig(this: TSConfigControls, pkgPath: string, fileCreation: boolean = false, isToRemove: boolean = true){
            const nodeModulesPath = path.join(appRootPath, 'node_modules');

            this.isToRemove = isToRemove;
            const cliExecPath = cfg.getCLIExecPath();
            const basePath = '.';
            const baseTsPath = path.join(pkgPath, 'tsconfig.json');
            const baseTSConfig: TSConfigContent = JSON.parse(fs.readFileSync(baseTsPath, 'utf-8'));        
    
            const managerTSConfigContent: TSConfigContent = {        
                compilerOptions: {  
                    ...baseTSConfig.compilerOptions,       
                    baseUrl: basePath,
                    paths: {
                        ...(buildSection._builders?.ts?.paths || {})
                    }
                }
            };

            const jsonPackageFilePath = path.join(pkgPath, 'package.json');
            const packageJson: { 
                dependencies: {[packageName: string] : string}, 
                devDependencies: {[packageName: string] : string} 
            } = JSON.parse(fs.readFileSync(jsonPackageFilePath, 'utf-8'));

            const deps: Set<string> = new Set([
                ...Object.keys(packageJson.dependencies).filter(packageName => packageName.startsWith('@rws-framework')),
                ...Object.keys(packageJson.devDependencies).filter(packageName => packageName.startsWith('@rws-framework'))
            ]);    

            let includes: Pathkeeper[] = [
                new Pathkeeper(wrkDir, path.join(wrkDir, 'src')),
                new Pathkeeper(wrkDir, path.join(pkgPath)),
                ...Array.from(deps).map(depItem => new Pathkeeper(wrkDir, _self.processDepItem(depItem, nodeModulesPath, pkgPath)))
            ];

            let excludes: Pathkeeper[] = [
                // new Pathkeeper(wrkDir, nodeModulesPath)
            ]

            if(fileCreation){
                const mapResolveRelative = (item: Pathkeeper): string => item.rel(); 

                managerTSConfigContent.include = includes.map(mapResolveRelative);
                managerTSConfigContent.exclude = excludes.map(mapResolveRelative);

                fs.writeFileSync(tsPath, JSON.stringify(managerTSConfigContent, null, 2));           
            }
    
            return {
                config: managerTSConfigContent,
                path: tsPath,
                fileName: TSConfigHelper.tsFileName,
                fileCreated: fileCreation,
                includes,
                excludes,               
            };
        };

        function remove(this: TSConfigControls){
            if(this.isToRemove){
                fs.unlinkSync(tsPath);
            }
        };

        controlSet.tsConfig = tsConfig.bind(controlSet);
        controlSet.remove = remove.bind(controlSet);
        
        return controlSet as TSConfigControls;
    }

    private processDepItem(item: string, nodeModulesPath: string, packagePath: string): string
    {
        const linkedPath = path.resolve(packagePath, '..', item.split('/')[1]);
        if(fs.existsSync(linkedPath)){
            return linkedPath;
        }

        return path.join(nodeModulesPath, item);
    }

    private deepMergeTSConfigs(baseConfig: TSConfigContent, overrideConfig: TSConfigContent){
        const merged: TSConfigContent = { ...baseConfig };

        if (overrideConfig.compilerOptions) {
            merged.compilerOptions = {
                ...baseConfig.compilerOptions,
                ...overrideConfig.compilerOptions,
                paths: {
                    ...(baseConfig.compilerOptions?.paths || {}),
                    ...(overrideConfig.compilerOptions.paths || {})
                }
            };
        }

        if (overrideConfig.include) {
            merged.include = [
                ...(baseConfig.include || []),
                ...overrideConfig.include
            ];
        }

        if (overrideConfig.exclude) {
            merged.exclude = [
                ...(baseConfig.exclude || []),
                ...overrideConfig.exclude
            ];
        }
        
        if (overrideConfig.extends) {
            merged.extends = overrideConfig.extends;
        }

        if (overrideConfig.files) {
            merged.files = [
                ...(baseConfig.files || []),
                ...overrideConfig.files
            ];
        }

        return merged;
    }
}