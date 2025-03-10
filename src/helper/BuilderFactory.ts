import { BuildType, BuilderType } from '../types/run';
import builders from '../models';
import { RWSBuilder } from '../models/_builder';
import { ConfigHelper } from './ConfigHelper';
import { RWSManager } from '../managers/RWSManager';


export interface IBuilderFactoryParams {
    workspacePath:string;
    appRootPath: string;
    workspaceType: Exclude<BuildType, BuildType.ALL>;
    builderType: BuilderType;
}

export function BuilderFactory(this: RWSManager, params: IBuilderFactoryParams, config: ConfigHelper){
    const { builderType } = params;
    const builderModel: any = (builders as { [key: string]: typeof RWSBuilder })[builderType];
    return new builderModel(params, config, this);
}