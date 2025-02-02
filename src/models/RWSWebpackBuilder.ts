import { RWSBuilder } from './_builder';
import path from 'path';
import type { Configuration as WebpackConfig } from 'webpack';
import webpack from 'webpack';
import fs from 'fs';
import chalk from  'chalk'
import { BuilderType } from '../managers/RWSManager';
import { BuildersConfigurations, IManagerConfig, IWebpackRWSConfig, RunnableConfig } from '../types/manager';
import concurrently from 'concurrently';

export class RWSWebpackBuilder extends RWSBuilder<WebpackConfig> {
    async build(watch: boolean = false): Promise<void> {        
        const workspaceSection: RunnableConfig = this.config.get(this.buildType as keyof IManagerConfig);
        const buildersConfig: BuildersConfigurations = workspaceSection._builders;
        const configBuildSection = buildersConfig ? buildersConfig[this.TYPE as keyof BuildersConfigurations] : null
        const buildCfg =  configBuildSection && configBuildSection.config ? configBuildSection.config  : null;
        const webpackFileConfigPath =  configBuildSection && configBuildSection.customConfigFile ? configBuildSection.customConfigFile : 'webpack.config.js';        

        if(!buildCfg){
            if(!fs.existsSync(path.join(this.workspacePath, webpackFileConfigPath))){
                throw new Error(`No ${webpackFileConfigPath} on target path ${this.workspacePath}`)
            }

            const webpackCmdParams: string [] = [];
            
            this.log(`Building...`);  

            if(!watch){
                await this.runCommand(
                    `npx webpack --config ${webpackFileConfigPath}${this.produceParamString(webpackCmdParams)}`, 
                    this.workspacePath, 
                    !this.isVerbose(), {
                    VERBOSE: this.isVerbose() ? 1 : 0
                });
            }else{
                concurrently([
                    { command: `nodemon --watch ${path.basename(path.dirname(workspaceSection.customOutputFile))} ${workspaceSection.customOutputFile}`, name: 'app', cwd: this.workspacePath },
                    { command: `webpack --config ${webpackFileConfigPath}${this.produceParamString(webpackCmdParams)} --watch`, name: 'webpack', cwd: this.workspacePath }
                    ], {
                    prefix: 'name',
                    killOthers: ['failure', 'success'],
                    restartTries: 3
                });  
            }              

            this.log(`Build complete.`);
        }else{
            await new Promise((resolve) => {
                webpack(buildCfg).run(() => { 
                    resolve(null); 
                });
            });
        }
    }

    
}