import { BuilderType, BuildType } from '../managers/RWSManager';
import { BuildersConfigurations, IManagerConfig, BuildConfig, BaseRWSConfig, RunnableConfig } from '../types/manager';
import Singleton from './_singleton';

export class ConfigHelper<T extends object = {}> extends Singleton {
    private data: IManagerConfig = {};

    private constructor(_DEFAULT_CONFIG?: T){
        super();    
        
        if(_DEFAULT_CONFIG){            
            this.data = _DEFAULT_CONFIG;
        }
    }  

    getAll(): IManagerConfig{
        return this.data;
    }

    get<K extends keyof IManagerConfig = any>(key: K): IManagerConfig[K]
    {
        return this.data[key];
    }

    getBuildTypeSection(type: Exclude<BuildType, BuildType.ALL>): BaseRWSConfig | RunnableConfig
    {
        return this.data[type as keyof IManagerConfig];
    }

    getBuilderSection(type: Exclude<BuildType, BuildType.ALL>, builderType: BuilderType): BuildConfig<any> | null
    {
        const buildersConfig: BuildersConfigurations = this.getBuildTypeSection(type)._builders;
        return buildersConfig ? buildersConfig[builderType as keyof BuildersConfigurations] : null
    }

    set<K extends keyof IManagerConfig = any, V extends IManagerConfig[K] = any>(key: K, value: V): ConfigHelper<T>;
    set<V extends IManagerConfig  = IManagerConfig>(value: V): ConfigHelper<T>;
    set<K extends keyof IManagerConfig = any, V extends IManagerConfig[K] = any>(keyOrValue: K | V, value?: V): ConfigHelper<T> {
        if (value !== undefined) {            
            this.data[keyOrValue as K] = value;
        } else {            
            this.data = { ...this.data, ...(keyOrValue as V) };
        }
        return this;
    }
}