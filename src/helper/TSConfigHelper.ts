import fs, { link } from 'fs';
import path from 'path';
import { ConfigHelper } from './ConfigHelper';
import { BuildType } from '../types/run';
import Singleton from './_singleton';
import { PackageJson, TSConfigContent, TSConfigControls } from '../types/tsc';

export class Pathkeeper {
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
                                
            const mainModuleDeps = _self.scanDeps(nodeModulesPath, path.join(wrkDir, 'package.json'), true);

            if(wrkDir !== appRootPath){
                console.log({ mainModuleDeps });                
                const appRootModuleDeps = _self.scanDeps(nodeModulesPath, path.join(appRootPath, 'package.json'), true);
                console.log({ appRootModuleDeps });                

            }

            const managerTSConfigContent: TSConfigContent = {        
                compilerOptions: {  
                    ...baseTSConfig.compilerOptions,       
                    baseUrl: basePath,
                    paths: {
                        ...(buildSection._builders?.ts?.paths || {})
                    }
                }
            };
            
            const deps: Set<string> = _self.scanDeps(nodeModulesPath, path.join(pkgPath, 'package.json'));

            console.log({deps});

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

    getPackageJson(jsonPath: string): PackageJson 
    {   
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }

    private scanDeps(nodeModulesPath: string, pkgJsonPath: string, nonRwsScan = false): Set<string>
    {        
        const packageJson = this.getPackageJson(pkgJsonPath);
        

        if(!packageJson._rws && !nonRwsScan){
            return new Set<string>();
        }

        const deps: Set<string> = new Set([
            ...(Object.keys(packageJson.dependencies ?? {}).filter(packageName => packageName.startsWith('@rws-framework') && this.isRWSPackage(nodeModulesPath, packageName))),
            ...(Object.keys(packageJson.devDependencies ?? {}).filter(packageName => packageName.startsWith('@rws-framework') && this.isRWSPackage(nodeModulesPath, packageName)))
        ]);    

        let subDependencies = new Set<string>();

        for(const subDep of deps){
            subDependencies = new Set<string>([...subDependencies, ...this.scanDeps(nodeModulesPath, path.join(nodeModulesPath, subDep, 'package.json'))]);
        }

        return new Set<string>([...deps, ...subDependencies]);
    }

    private isRWSPackage(nodeModulesPath: string, packageName: string): boolean {
        const packageJson = this.getPackageJson(path.join(nodeModulesPath, packageName, 'package.json'));

        return packageJson?._rws === true;
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