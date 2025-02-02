import Singleton from "../helper/_singleton";
import { ConfigHelper } from "../helper/ConfigHelper";
import { IManagerConfig, BaseRWSConfig, BuildersConfigurations, RunnableConfig } from "../types/manager";
import path from 'path';
import { BuilderFactory } from '../helper/BuilderFactory';
import { RWSRunner } from '../models/RWSRunner';
import fs from 'fs';

export enum BuildType {
    FRONT = 'front',
    CLI = 'cli',
    BACK = 'back',  
    ALL = 'all'
}

export enum BuilderType {
    WEBPACK = 'webpack',
    VITE = 'vite'    
}

export class RWSManager extends Singleton {
    private config: ConfigHelper<IManagerConfig>;
    private appRootPath: string;
    private commandParams: string[] = [];
    private isVerbose: boolean = false;

    private constructor(rwsConfig: IManagerConfig, appRootPath?: string, commandParams: string[] = []){
        super();

        if(!appRootPath){
            appRootPath = process.cwd();
        }

        this.appRootPath = appRootPath;        

        this.commandParams = commandParams.filter(arg => arg.indexOf('--verbose') == -1);
        this.isVerbose = commandParams.find(arg => arg.indexOf('--verbose') > -1) !== undefined;
        this.config = ConfigHelper.create(rwsConfig);        
    }

    static async getRWSConfig(): Promise<IManagerConfig>
    {
        //@ts-ignore
        return (await import(`@/rws.config`)).default();
    }

    public static async start(appRootPath?: string, commandParams: string[] = []): Promise<RWSManager>
    {
        if(!appRootPath){
            appRootPath = process.cwd();
        }

        return RWSManager.create(await this.getRWSConfig(), appRootPath, commandParams);
    }

    public async build(type: BuildType = BuildType.ALL)
    {
        if(type === BuildType.ALL){
            // Iterate through all build types except 'all'
            const buildTypes = Object.values(BuildType)
                .filter(t => t !== BuildType.ALL);
            
            for (const buildType of buildTypes) {
                if(this.config.get(buildType as keyof IManagerConfig)){
                    await this.buildWorkSpace(buildType as Exclude<BuildType, BuildType.ALL>);
                }                
            }
        } else {
            if(!this.config.get(type as keyof IManagerConfig)){
                throw new Error(`No configuration for "${type}" workspace in rws.config.ts`)
            }

            await this.buildWorkSpace(type);
        }        
    }

    public async run(type: BuildType = BuildType.ALL)
    {
        if(type === BuildType.ALL){
            // Iterate through all build types except 'all'
            const buildTypes = Object.values(BuildType)
                .filter(t => t !== BuildType.ALL);
            
            for (const buildType of buildTypes) {
                if(this.config.get(buildType as keyof IManagerConfig)){
                    await this.runWorkSpace(buildType as Exclude<BuildType, BuildType.ALL>);
                }                
            }
        } else {
            if(!this.config.get(type as keyof IManagerConfig)){
                throw new Error(`No configuration for "${type}" workspace in rws.config.ts`)
            }

            await this.runWorkSpace(type);
        }        
    }

    private async buildWorkSpace(type: Exclude<BuildType, BuildType.ALL>, builderType: BuilderType = BuilderType.WEBPACK){             
        const workspaceCfg = this.config.getBuildTypeSection(type);
        const buildPath = path.join(this.appRootPath, workspaceCfg.entrypoint);
        const isWatch = this.commandParams.find(item => item === '--watch') !== undefined;
        
        await (BuilderFactory({ 
            workspacePath:buildPath, 
            appRootPath: this.appRootPath, 
            workspaceType: type, 
            builderType
        }, this.config))
            .setVerbose(this.isVerbose || isWatch)
            .build(isWatch);
    }

    private async runWorkSpace(type: Exclude<BuildType, BuildType.ALL>){                     
        const runner = new RWSRunner({
            appRootPath: this.appRootPath,
            isVerbose: this.isVerbose
        }, this.config);

        const outFile = path.join(this.appRootPath, (this.config.getBuildTypeSection(type) as RunnableConfig).customOutputFile);

        if(!fs.existsSync(outFile)){
            await this.buildWorkSpace(type, BuilderType.WEBPACK);
        }

        await runner.run(type);
    }

    getCommandParams()
    {
        return this.commandParams;
    }
}