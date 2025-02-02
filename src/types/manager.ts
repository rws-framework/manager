import { Configuration as WebpackConfig } from 'webpack';


export interface BaseRWSConfig {
    entrypoint: string;
    pubDir?: string;
    _builders?: BuildersConfigurations
}

export interface BuildersConfigurations {
    webpack?: IWebpackRWSConfig
}

export interface IWebpackRWSConfig {
    config?: WebpackConfig,
    customConfigFile?: string
}

export interface IFrontendConfig extends BaseRWSConfig {
}

export interface IBackendConfig  extends BaseRWSConfig {    
}

export interface IManagerConfig {
    front?: IFrontendConfig;
    back?: IBackendConfig;
}