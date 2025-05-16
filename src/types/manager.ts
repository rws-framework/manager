import { Configuration as WebpackConfig } from 'webpack';
import { RunnableConfig } from '../types/run';
import { TSConfigData } from './tsc';

export interface BaseRWSConfig {    
    workspaceDir: string;       
    entrypoint?: string;
    executionDir?: string;    
    publicDir?: string;
    outputDir?: string;
    outputFileName?: string;
    aliases?: {
      [key: string]: string;
    };   
    env?: {
        [key: string]: string | undefined;
    };
    _builders?: BuildersConfigurations
}

export interface BuildersConfigurations {
    webpack?: IWebpackRWSConfig;
    ts?: {
        paths?: {
            [alias: string]: string[]
        },
        includes?: string[],
        excludes?: string[]
    }
}

export interface BuildConfig<T> {
    config?: T,
    customConfigFile?: string,
}

export interface IWebpackRWSConfig extends BuildConfig<WebpackConfig> {
    externalsOverride?: string[]
    loaderIgnoreExceptionString?: string
}

export interface IFrontendConfig extends BaseRWSConfig {
    hotReload?: boolean;
    pkgReport?: boolean;
    parted?: boolean;
    partedDirUrlPrefix?: string;
    copyAssets?: {
        [destinationPath: string]: string[];
    },
    env?: {        
        [key: string]: string | undefined;
        DOMAIN?: string;
        WS_URL?: string;
        BACKEND_URL?: string;          
    }
}

export interface IBackendConfig  extends RunnableConfig { 
    externalRoutesFiles?:string[];
    env?: {        
        [key: string]: string | undefined;
        DOMAIN?: string;        
    }   
}

export interface ICLIConfig  extends RunnableConfig {    
}

export interface IRWSWorkspaces {
    front?: IFrontendConfig;
    back?: IBackendConfig;
    cli?: ICLIConfig;
}    

export interface IManagerConfig {
    dev?: boolean,
    build: IRWSWorkspaces    
}

export {RunnableConfig}