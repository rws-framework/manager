import path from 'path';
import { BuilderType, BuildType } from '../managers/RWSManager';
import { BuildersConfigurations, IManagerConfig, BuildConfig, BaseRWSConfig, RunnableConfig, IRWSWorkspaces, IFrontendConfig, IBackendConfig, ICLIConfig } from '../types/manager';
import Singleton from './_singleton';

export class ConfigHelper<T extends IManagerConfig = IManagerConfig> extends Singleton {
    private data: IManagerConfig;
    private cliExecPath: string;

    private constructor(_DEFAULT_CONFIG?: T){
        super();    
        
        if(_DEFAULT_CONFIG){            
            this.data = _DEFAULT_CONFIG;
        }

        this.cliExecPath = process.env.CLI_EXEC || '';
    }  

    get(): IManagerConfig
    {
        return this.data;
    }

    getCLIExecPath(): string
    {
        return this.cliExecPath;
    }

    getOutputFilePath(appRootPath: string, type: Exclude<BuildType, BuildType.ALL>){
        const sectionCfg = this.getBuildTypeSection(type) as RunnableConfig;
        const outputFileDir = sectionCfg.outputDir || `./build`; 
        const outputFileName = (this.getBuildTypeSection(type) as RunnableConfig).outputFileName || `${type.toLowerCase()}.rws.js`; 
        
        return path.join(appRootPath, sectionCfg.workspaceDir, outputFileDir, outputFileName)
    }

    getBuildTypeSection(type: Exclude<BuildType, BuildType.ALL>): IFrontendConfig & IBackendConfig & ICLIConfig
    {
        const buildTypeSection = this.data.build[type as keyof IRWSWorkspaces];

        switch(type){
            case BuildType.FRONT: return buildTypeSection as IFrontendConfig;
            case BuildType.BACK: return buildTypeSection as IBackendConfig;
            case BuildType.CLI: return buildTypeSection as ICLIConfig;
            default: throw new Error('[RWS] Wrong build type value.')
        }    
    }

    getBuilderSection(type: Exclude<BuildType, BuildType.ALL>, builderType: BuilderType): BuildConfig<any> | null
    {
        const buildTypeSection = this.getBuildTypeSection(type);
        const buildersConfig: BuildersConfigurations | undefined = buildTypeSection._builders;
        const builderConfigData = buildersConfig ? buildersConfig[builderType as keyof BuildersConfigurations] : null;

        return builderConfigData ?? null;
    }

    getEntrypoint(type: Exclude<BuildType, BuildType.ALL>): string
    {
        const buildTypeSection = this.getBuildTypeSection(type);

        return buildTypeSection.entrypoint ?? 'src/index.ts';
    }

    set<V extends IManagerConfig  = IManagerConfig>(value: V): ConfigHelper<T> {
        this.data = value;

        return this;
    }
}