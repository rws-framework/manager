import { ConfigHelper } from '../helper/ConfigHelper';
import { rwsShell } from "@rws-framework/console";
import path from 'path';
import fs from 'fs';

import { BuilderType, BuildType } from '../managers/RWSManager';
import { RunnableConfig } from '../types/manager';

export interface IRunnerParams {
    appRootPath: string;
    isVerbose: boolean;
}

export class RWSRunner {
    constructor(private params: IRunnerParams, private config: ConfigHelper){}

    async run(buildType: Exclude<BuildType, BuildType.ALL>): Promise<void>
    {        
        const sectionConfig = this.config.getBuildTypeSection(buildType) as RunnableConfig;
        const outFilePath = this.config.getOutputFilePath(this.params.appRootPath, buildType as Exclude<BuildType, BuildType.ALL>);
    
        await rwsShell.runCommand(`node ${outFilePath}`, path.join(this.params.appRootPath, sectionConfig.workspaceDir));
    }
}