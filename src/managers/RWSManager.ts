import Singleton from "../helper/_singleton";
import { ConfigHelper } from "../helper/ConfigHelper";
import { IManagerConfig, BaseRWSConfig, BuildersConfigurations } from "../types/manager";
import path from 'path';
import { BuilderFactory } from '../helper/BuilderFactory';
import { RWSRunner } from '../models/RWSRunner';
import fs from 'fs';
import chalk from "chalk";
import { BuilderType, BuildType, Environment, ManagerRunOptions, RunnableConfig } from "../types/run";



export class RWSManager extends Singleton {
    private config: ConfigHelper<IManagerConfig>;
    private appRootPath: string;    
    private isVerbose: boolean = false;

    private constructor(rwsConfig: IManagerConfig, private commandParams: string[] = [], private commandOptions: string[] = []){
        super();

        this.isVerbose = this.commandOptions.find(arg => arg.indexOf('--verbose') > -1) !== undefined;
        this.config = ConfigHelper.create(rwsConfig);        

        this.appRootPath = this.config.getAppRoot();        

    }

    private initCfg(type: Exclude<BuildType, BuildType.ALL>): void
    {
        this.setEnvironment(this.config.get(), type);
    }

    static async getRWSConfig(): Promise<IManagerConfig>
    {
        //@ts-ignore
        return (await import(`@rws-config`)).default();
    }

    public static async start(commandParams: string[] = [], options: string[]): Promise<RWSManager>
    {       
        return RWSManager.create(await this.getRWSConfig(), commandParams, options);
    }

    public async build(type?: BuildType)
    {
        if(!type){
            type = BuildType.ALL;
        }
        
        if(type === BuildType.ALL){
            // Iterate through all build types except 'all'
            const buildTypes = Object.values(BuildType)
                .filter(t => t !== BuildType.ALL);
            
            for (const buildType of buildTypes) {
                if(this.config.getBuildTypeSection(buildType)){
                    await this.buildWorkSpace(buildType as Exclude<BuildType, BuildType.ALL>);
                }                
            }
        } else {
            this.initCfg(type);
            if(!this.config.getBuildTypeSection(type)){
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
                if(this.config.getBuildTypeSection(buildType)){
                    await this.runWorkSpace(buildType as Exclude<BuildType, BuildType.ALL>);
                }                
            }
        } else {
            if(!this.config.getBuildTypeSection(type)){
                throw new Error(`No configuration for "${type}" workspace in rws.config.ts`)
            }

            await this.runWorkSpace(type);
        }        
    }

    private async buildWorkSpace(type: Exclude<BuildType, BuildType.ALL>, builderType: BuilderType = BuilderType.WEBPACK){             
        const workspaceCfg = this.config.getBuildTypeSection(type);
        const buildPath = path.join(this.appRootPath, workspaceCfg.workspaceDir);
        const isWatch = this.commandOptions.find(item => item === '--watch') !== undefined;

        this.log(`${isWatch ? 'Watching' : 'Building'} ${chalk.blue(type.toLowerCase())}`);        
        
        await (BuilderFactory.bind(this)({ 
            workspacePath: buildPath, 
            appRootPath: this.appRootPath, 
            workspaceType: type, 
            builderType
        }, this.config))
            .setVerbose(this.isVerbose || isWatch)
            .build(isWatch);
    }

    private setEnvironment(configObject: IManagerConfig, buildType: Exclude<BuildType, BuildType.ALL>): IManagerConfig
    {
        if(!RWSRunner.RUNNABLE_WORKSPACES.includes(buildType)){
            return configObject;
        }

        const section = configObject.build[buildType] as RunnableConfig;

        if(configObject.build[buildType]){
            (configObject.build[buildType] as RunnableConfig).environment = section?.environment ?? Environment.NODE;
        }    

        return configObject;
    }

    private async runWorkSpace(type: Exclude<BuildType, BuildType.ALL>){                     
        const runner = new RWSRunner({
            appRootPath: this.appRootPath,
            isVerbose: this.isVerbose
        }, this.config);     
         
        this.initCfg(type);
        runner.checkRunnable(type);
        
        const outFile = this.config.getOutputFilePath(this.appRootPath, type);        

        const hasBinFile = !fs.existsSync(outFile);
        let forceBuild: boolean = hasBinFile;        

        if(!forceBuild && this.hasOption(ManagerRunOptions.BUILD)){
            forceBuild = true;
        }

        if(forceBuild){
            if(hasBinFile){
                this.log(chalk.yellow('No runfile file detected.') + ' Building output runfile...')
            }

            if(this.hasOption(ManagerRunOptions.BUILD)){
                this.log(chalk.yellow(`--${ManagerRunOptions.BUILD} option detected.`) + ' Reloading output runfile build...');
            }

            await this.buildWorkSpace(type, BuilderType.WEBPACK);
        }


        await runner.run(type);
    }

    getCommandParams(): string[]
    {
        return this.commandParams;
    }

    hasOption(option: ManagerRunOptions): boolean
    {
        return this.commandOptions.find(item => item === `--${option}`) !== undefined;
    }

    private log(txt: string): void
    {
        console.log(`${chalk.green('[RWS MANAGER]')} ${txt}`)
    }
}