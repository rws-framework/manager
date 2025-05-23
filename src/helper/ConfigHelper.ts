import path from 'path';
import { BuilderType, BuildType } from '../types/run';
import { BuildersConfigurations, IManagerConfig, BuildConfig, BaseRWSConfig, RunnableConfig, IRWSWorkspaces, IFrontendConfig, IBackendConfig, ICLIConfig, IWebpackRWSConfig } from '../types/manager';
import Singleton from './_singleton';

export class ConfigHelper<T extends IManagerConfig = IManagerConfig> extends Singleton {
    private data: IManagerConfig;
    private cliExecPath: string;
    private appRootPath: string;

    private constructor(_DEFAULT_CONFIG?: T, private appParams: string[] = []){
        super();    
        
        if(_DEFAULT_CONFIG){            
            this.data = _DEFAULT_CONFIG;
        }

        this.cliExecPath = process.env.RWS_CLI_EXEC || '';
        this.appRootPath = process.env.RWS_APP_ROOT || '';
    }  

    get(): IManagerConfig
    {
        return this.data;
    }

    getAppParams(){
        return this.appParams;
    }

    getCLIExecPath(): string
    {
        return this.cliExecPath;
    }

    getAppRoot(): string
    {
        return this.appRootPath;
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

    getBuilderSection(type: Exclude<BuildType, BuildType.ALL>, builderType: BuilderType): IWebpackRWSConfig 
    {
        const buildTypeSection = this.getBuildTypeSection(type);
        const buildersConfig: BuildersConfigurations | undefined = buildTypeSection._builders;
        const builderConfigData = buildersConfig ? buildersConfig[builderType as keyof BuildersConfigurations] : null;

        return builderConfigData as IWebpackRWSConfig;
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