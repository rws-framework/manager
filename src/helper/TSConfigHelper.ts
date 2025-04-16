import fs from 'fs';
import path from 'path';
import { ConfigHelper } from './ConfigHelper';
import { BuildType } from '../types/run';
import Singleton from './_singleton';
import { PackageJson, TSConfigContent, TSConfigControls, UserCompilerOptions } from '../types/tsc';

export class Pathkeeper {
    constructor(private basePath: string, private filePath: string, private sameStringMode: boolean = false){};

    rel(): string
    {
        return this.sameStringMode ? this.filePath : path.relative(this.basePath, this.filePath);
    }

    abs(): string
    {
        return path.resolve(this.basePath, this.filePath);
    }

    toString(): string {
        return this.filePath;
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
    private buildType: Exclude<BuildType, BuildType.ALL>

    constructor(private cfg: ConfigHelper){
        super();        

        if(cfg){
            this.cfg = cfg;
        }
    }

    build(        
        appRootPath: string,
        buildType: Exclude<BuildType, BuildType.ALL>
    ): TSConfigControls  {
        const buildSection = this.cfg.getBuildTypeSection(buildType);
        const wrkDir = path.join(appRootPath, buildSection.workspaceDir);
        const tsPath = path.join(wrkDir, TSConfigHelper.tsFileName);                

        const _self = this;
        
        _self.buildType = buildType;
        const controlSet: Partial<TSConfigControls> =  {
            isToRemove: false                        
        }      

        async function tsConfig(this: TSConfigControls, pkgPath: string, fileCreation: boolean = false, isToRemove: boolean = true){
            const nodeModulesPath = path.join(appRootPath, 'node_modules');

            this.isToRemove = fileCreation && isToRemove;
            const cliExecPath = _self.cfg.getCLIExecPath();
            const basePath = '.';//appRootPath === wrkDir ? '.' : path.relative(wrkDir, appRootPath);
            const baseTsPath = path.join(pkgPath, 'tsconfig.json');            

            const managerTSConfigContent: TSConfigContent = {        
                compilerOptions: {  
                    ..._self.getDefaultCompilerOptions(),       
                    baseUrl: basePath,
                    paths: {
                        ...(buildSection._builders?.ts?.paths || {})
                    }
                }
            };

            const [includes, excludes] = await _self.getDependencies(nodeModulesPath, wrkDir, appRootPath, pkgPath);        

            if(buildType !== BuildType.FRONT){
                const conflictingType: BuildType = buildType === BuildType.BACK ? BuildType.CLI : BuildType.BACK;
                const conflictingWorkspace = _self.cfg.getBuildTypeSection(conflictingType);   
                
                const realNestPath = await _self.processDepItem('@rws-framework/server/nest', nodeModulesPath, wrkDir);
                
                managerTSConfigContent.compilerOptions.paths['@rws-framework/server/nest/index.ts'] = [
                    path.relative(wrkDir, realNestPath)
                ];

                managerTSConfigContent.compilerOptions.paths['@rws-framework/server/nest/*'] = [
                    path.relative(wrkDir, realNestPath) + '/*'
                ];

                includes.push(new Pathkeeper(wrkDir, realNestPath));
                excludes.push(new Pathkeeper(wrkDir, conflictingWorkspace.entrypoint || './src/index.ts', true));
            }else if(_self.cfg.get().build.back){
                const backWorkspace = _self.cfg.getBuildTypeSection(BuildType.BACK);
                if(backWorkspace.externalRoutesFile){
                    const routesPaths = path.join(appRootPath, backWorkspace.workspaceDir, backWorkspace.externalRoutesFile);

                    managerTSConfigContent.compilerOptions.paths[path.relative(wrkDir, routesPaths)] = [
                        path.relative(wrkDir, routesPaths)
                    ]

                    managerTSConfigContent.compilerOptions.paths[path.relative(wrkDir, path.dirname(routesPaths) + '/*')] = [
                        path.relative(wrkDir, path.dirname(routesPaths) + '/*')
                    ]

                    includes.push(new Pathkeeper(wrkDir, path.dirname(routesPaths)));
                }                
            }
            
            if(buildType === BuildType.FRONT){
                const realBuilderPath = await _self.processDepItem('@rws-framework/client/builder', nodeModulesPath, wrkDir);
                const realCfgPath = await _self.processDepItem('@rws-framework/client/cfg', nodeModulesPath, wrkDir);

                excludes.push(new Pathkeeper(wrkDir, realBuilderPath));
                excludes.push(new Pathkeeper(wrkDir, realCfgPath));
            }


            if(fileCreation){
                _self.fitConfigMapping(managerTSConfigContent, includes, excludes);

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

        controlSet.tsConfig = tsConfig.bind(controlSet as TSConfigControls);
        controlSet.remove = remove.bind(controlSet as TSConfigControls);
        
        return controlSet as TSConfigControls;
    }

    getPackageJson(jsonPath: string): PackageJson 
    {   
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }

    public async getDependencies(nodeModulesPath: string, wrkDir: string, appRootPath?: string, pkgPath?: string, forcedRoot?: string, buildType?: Exclude<BuildType, BuildType.ALL>): Promise<[Pathkeeper[], Pathkeeper[]]>
    {
        if(buildType){
            this.buildType = buildType;
        }

        const appRootModuleDeps = appRootPath && wrkDir !== appRootPath 
            ? this.scanDeps(nodeModulesPath, path.join(appRootPath, 'package.json'), true) 
            : new Set<string>();              
    
        const mainModuleDeps = new Set([
            ...this.scanDeps(nodeModulesPath, path.join(wrkDir, 'package.json'), true), 
            ...appRootModuleDeps
        ]);

        const entrypoint = path.join(wrkDir, this.cfg.getEntrypoint(this.buildType));

        
        const readyPackageSrc = fs.existsSync(path.join(wrkDir, 'src')) ? [new Pathkeeper(forcedRoot ? forcedRoot : wrkDir, path.dirname(entrypoint))] : [];

        const firstArray = [
            ...readyPackageSrc,                             
        ];

        for(const mainDep of Array.from(mainModuleDeps)){                 
              firstArray.push(new Pathkeeper(forcedRoot ? forcedRoot : wrkDir, await this.processDepItem(mainDep, nodeModulesPath, pkgPath, forcedRoot)));           
        }
            
        const uniqueFirstArray = [...new Set(firstArray)];            

        return [uniqueFirstArray, []];
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

    private async processDepItem(item: string, nodeModulesPath: string, packagePath?: string, forcedRoot?: string): Promise<string>
    {
        const basicPath = path.join(nodeModulesPath, item);
        
        if(packagePath){
            const packageRest = item.split('/').slice(2).join('/');
            let packageDir = item.split('/')[1];    

            const symlinkPath = path.join(nodeModulesPath, '@rws-framework', packageDir);
            const pkgDirStat = fs.lstatSync(symlinkPath);          

            if(pkgDirStat.isSymbolicLink()){   
              
                const targetPath = await fs.promises.realpath(symlinkPath);                
                return fs.existsSync(targetPath) ? path.join(targetPath, packageRest) : basicPath;
            }
        }        

        return basicPath;
    }

    getDefaultCompilerOptions(): UserCompilerOptions
    {
        return {
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            target: "ES2018",
            module: "commonjs",
            moduleResolution: "node",
            strict: false,
            skipLibCheck: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            strictNullChecks: false,
            allowSyntheticDefaultImports: true,
            declaration: false,
            allowJs: true,
            checkJs: false,
            baseUrl: ".",
            lib: [
                "DOM",
                "ESNext",
                "WebWorker"
            ],
            paths: {}
        }
    }

    fitConfigMapping(cfg: TSConfigContent, includes: Pathkeeper[], excludes: Pathkeeper[])
    {
        const mapResolveRelative = (item: Pathkeeper): string => item.rel(); 

        cfg.include = Array.from(new Set([...cfg.include || [], ...includes.map(mapResolveRelative)]));

        // const frontPkg = cfg.include.find((item) => item.includes('/client'));        
        // if(frontPkg){
        //     cfg.include.push(path.join(frontPkg, 'nest'));
        // }

        cfg.include = cfg.include.map((item) => {
             if(item.includes('/client') && !item.includes('/client/nest')){
                return path.join(item, 'src');
             }else{
                return item;
             }
        });

       

        cfg.exclude = Array.from(new Set([...cfg.exclude || [], ...excludes.map(mapResolveRelative)]));
    }
}