import { BuildType, BuilderType } from '../managers/RWSManager';
import builders from '../models';
import { RWSBuilder } from '../models/_builder';
import { ConfigHelper } from './ConfigHelper';


export interface IBuilderFactoryParams {
    workspacePath:string;
    appRootPath: string;
    workspaceType: Exclude<BuildType, BuildType.ALL>;
    builderType: BuilderType;
}

export function BuilderFactory(params: IBuilderFactoryParams, config: ConfigHelper){
    const { workspacePath, appRootPath, workspaceType, builderType } = params;

    const builderModel: any = (builders as { [key: string]: typeof RWSBuilder })[builderType];
    return new builderModel(params, config);
}