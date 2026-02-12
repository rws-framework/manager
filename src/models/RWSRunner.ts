import { ConfigHelper } from '../helper/ConfigHelper';
import { rwsShell } from "@rws-framework/console";
import path from 'path';
import fs from 'fs';

import {  BuildType, Environment, ManagerRunOptions } from '../types/run';
import { RunnableConfig } from '../types/run';
import { argv } from 'process';

export interface IRunnerParams {
    appRootPath: string;
    isVerbose: boolean;
}

export class RWSRunner {
    public static RUNNABLE_WORKSPACES: BuildType[] = [
        BuildType.BACK,
        BuildType.CLI
    ];

    constructor(private params: IRunnerParams, private config: ConfigHelper){}

    async run(buildType: Exclude<BuildType, BuildType.ALL>): Promise<void>
    {        
        const sectionConfig = this.config.getBuildTypeSection(buildType) as RunnableConfig;        
        const outFilePath = this.config.getOutputFilePath(this.params.appRootPath, buildType as Exclude<BuildType, BuildType.ALL>);
        
        // Get CLI arguments after the buildType but filter out manager options
        let extraParams = '';
        if (buildType === BuildType.CLI) {
            const argv = process.argv;
            // Find the index of buildType in argv and include everything after it
            const buildTypeIndex = argv.findIndex(arg => arg === buildType);
            if (buildTypeIndex !== -1 && buildTypeIndex + 1 < argv.length) {
                const allCliArgs = argv.slice(buildTypeIndex + 1);
                // Filter out manager options using the enum
                const managerOptions = Object.values(ManagerRunOptions).map(option => `--${option}`);
                const filteredArgs = allCliArgs.filter(arg => !managerOptions.includes(arg));
                if (filteredArgs.length > 0) {
                    extraParams = ` ${filteredArgs.join(' ')}`;
                }
            }
        }
                
        await rwsShell.runCommand(`${sectionConfig.environment} ${outFilePath}${extraParams}`, path.join(this.params.appRootPath, sectionConfig.workspaceDir));
    }   
    
    checkRunnable(sectionType: Exclude<BuildType, BuildType.ALL>): RWSRunner
    {
        RWSRunner.checkRunnable(this.config, sectionType);

        return this;
    }

    isRunnable(buildType: Exclude<BuildType,  BuildType.ALL>): boolean
    {
        try{
            RWSRunner.checkRunnable(this.config, buildType);

            return true;
        } catch(e: Error | any){
            return false;
        }
    }

    static checkRunnable(config: ConfigHelper, sectionType: Exclude<BuildType, BuildType.ALL>)
    {
        const sectionConfig = config.getBuildTypeSection(sectionType) as RunnableConfig;

        if(!sectionConfig.environment || !Object.values(Environment).includes(sectionConfig.environment)){
            throw new Error(`"${sectionType}" is not a runnable RWS workspace.`)
        }
    }
}