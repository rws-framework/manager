import { ConfigHelper } from "../helper/ConfigHelper";
import { Pathkeeper, TSConfigHelper } from "../helper/TSConfigHelper";
import { GenerateType } from "../types/generate";
import fs from 'fs';
import path from 'path';
import { TSConfigContent, UserCompilerOptions } from "../types/tsc";
import { BuildType } from "../types/run";
import chalk from "chalk";

export class RWSGenerator {
    constructor(private type: GenerateType, private config: ConfigHelper){}

    async generate(){
        switch(this.type){
            case GenerateType.TSCONFIG: return await this.generateTsConfig();
        }
    }

    async generateTsConfig(): Promise<void>
    {
        const targetTsPath = this.config.getAppRoot();

        if(!fs.existsSync(path.join(targetTsPath, 'rws.config.ts'))){
            throw new Error('RWS can generate tsconfig.json only in root path with "rws.config.ts" inside.');
        }

        const tsHelper = TSConfigHelper.create<TSConfigHelper>(this.config);

        const compilerOptions: UserCompilerOptions = tsHelper.getDefaultCompilerOptions();
        const targetFilePath = path.join(targetTsPath, 'tsconfig.json');

        const tsFileContent: TSConfigContent = fs.existsSync(targetFilePath) ? JSON.parse(fs.readFileSync(targetFilePath, 'utf-8')) : {
            compilerOptions
        }
        
        const uniquePaths: [Pathkeeper[], Pathkeeper[]] = [[],[]];

        for (const workspaceType of Object.values(BuildType).filter(item => item !== BuildType.ALL)){
            const workspaceInfo = this.config.getBuildTypeSection(workspaceType as Exclude<BuildType, BuildType.ALL>);

            const workspaceDeps: [Pathkeeper[], Pathkeeper[]] = await tsHelper.getDependencies(
                path.join(targetTsPath, 'node_modules'), 
                path.join(targetTsPath, workspaceInfo.workspaceDir), 
                targetTsPath,
                undefined,
                targetTsPath,
                workspaceType as Exclude<BuildType, BuildType.ALL>
            );                                

            for (let i = 0; i < 2; i++) {
                workspaceDeps[i].forEach(pathkeeper => {
                    const pathString = pathkeeper.toString();
                    if (!uniquePaths[i].find((item: Pathkeeper) => item.toString() === pathString)) {
                        uniquePaths[i].push(pathkeeper);                        
                    }
                });
            }
        }        

        const [ includes, excludes ] = uniquePaths;

        const detectedRwsPackages: string[] = [];

        for(const inc of includes){
            if(inc.toString().includes('@rws-framework')){
                detectedRwsPackages.push('@rws-framework/' + inc.toString().split('@rws-framework/')[1]);
            }
        }
            
        tsHelper.fitConfigMapping(tsFileContent, includes, excludes);

        fs.writeFileSync(targetFilePath, JSON.stringify(tsFileContent, null, 2));

        console.log(`${chalk.blue('[RWS Generator]')} Generated ${path.join(targetTsPath, 'tsconfig.json')}`);
    }
}