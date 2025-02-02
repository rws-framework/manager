import { Configuration as WebpackConfig } from 'webpack';


export interface BaseRWSConfig {
    entrypoint: string;
    pubDir?: string;
    _builders?: BuildersConfigurations
}

export interface BuildersConfigurations {
    webpack?: IWebpackRWSConfig
}

export interface BuildConfig<T> {
    config?: T,
    customConfigFile?: string,
}

export interface IWebpackRWSConfig extends BuildConfig<WebpackConfig> {

}

export interface RunnableConfig extends BaseRWSConfig {
    customOutputFile?: string;
}

export interface IFrontendConfig extends BaseRWSConfig {
}

export interface IBackendConfig  extends RunnableConfig {    
}

export interface ICLIConfig  extends RunnableConfig {    
}

export interface IManagerConfig {
    front?: IFrontendConfig;
    back?: IBackendConfig;
    cli?: ICLIConfig;
}