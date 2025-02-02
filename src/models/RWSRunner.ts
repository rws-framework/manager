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
        const outFile = path.join(this.params.appRootPath, sectionConfig.customOutputFile);

        await rwsShell.runCommand(`node ${outFile}`, path.join(this.params.appRootPath, sectionConfig.entrypoint));
    }
}