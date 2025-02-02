import { RWSBuilder } from './_builder';
import path from 'path';
import type { Configuration as WebpackConfig } from 'webpack';
import webpack from 'webpack';
import fs from 'fs';
import chalk from  'chalk'
import { BuilderType } from '../managers/RWSManager';
import { BuildersConfigurations, IManagerConfig, IWebpackRWSConfig } from '../types/manager';

export class RWSWebpackBuilder extends RWSBuilder<WebpackConfig> {
    async build(watch: boolean = false): Promise<void> {        
        const buildersConfig: BuildersConfigurations = this.config.get(this.buildType as keyof IManagerConfig)._builders;
        const configBuildSection = buildersConfig ? buildersConfig[this.TYPE as keyof BuildersConfigurations] : null
        const buildCfg =  configBuildSection && configBuildSection.config ? configBuildSection.config  : null;
        const webpackFileConfigPath =  configBuildSection && configBuildSection.customConfigFile ? configBuildSection.customConfigFile : 'webpack.config.js';        

        if(!buildCfg){
            if(!fs.existsSync(path.join(this.workspacePath, webpackFileConfigPath))){
                throw new Error(`No ${webpackFileConfigPath} on target path ${this.workspacePath}`)
            }

            const webpackCmdParams: string [] = [];
            
            this.log(`Building...`);  

            await this.runCommand(
                `npx webpack --config ${webpackFileConfigPath}${this.produceParamString(webpackCmdParams)}${watch ? ' --watch' : ''}`, 
                this.workspacePath, 
                !this.isVerbose(), {
                    VERBOSE: this.isVerbose() ? 1 : 0
                });

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