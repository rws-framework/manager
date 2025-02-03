import { Configuration as WebpackConfig } from 'webpack';
import { RunnableConfig } from '../types/run';

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
        [key: string]: string | number | boolean;
    };
    _builders?: BuildersConfigurations
}

export interface BuildersConfigurations {
    webpack?: IWebpackRWSConfig;
    ts?: {
        paths?: {
            [alias: string]: string[]
        }
    }
}

export interface BuildConfig<T> {
    config?: T,
    customConfigFile?: string,
}

export interface IWebpackRWSConfig extends BuildConfig<WebpackConfig> {

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
        [key: string]: string | number | boolean;
        DOMAIN?: string;
        WS_URL?: string;
        BACKEND_URL?: string;          
    }
}

export interface IBackendConfig  extends RunnableConfig { 
    env?: {        
        [key: string]: string | number | boolean;
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
    build: IRWSWorkspaces,
}