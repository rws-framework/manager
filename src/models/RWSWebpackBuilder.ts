import { RWSBuilder } from './_builder';
import path from 'path';
import type { Configuration as WebpackConfig } from 'webpack';
import webpack from 'webpack';
import fs from 'fs';
import { BuildersConfigurations, IBackendConfig, ICLIConfig, IFrontendConfig, RunnableConfig } from '../types/manager';
import { BuildType } from '../managers/RWSManager';
import { TSConfigHelper } from '../helper/TSConfigHelper';
import { TSConfigContent } from '../types/tsc';


export class RWSWebpackBuilder extends RWSBuilder<WebpackConfig> {
    async build(watch: boolean = false): Promise<void> {              
        const workspaceSection: RunnableConfig = this.config.get().build[this.buildType];
        const buildersConfig: BuildersConfigurations | undefined = workspaceSection?._builders;
        const configBuildSection = buildersConfig ? buildersConfig[this.TYPE as keyof BuildersConfigurations] : null
        const buildCfg =  configBuildSection && configBuildSection.config ? configBuildSection.config  : null;
        const webpackFileConfigPath =  configBuildSection && configBuildSection.customConfigFile ? configBuildSection.customConfigFile : 'webpack.config.js';        

        if(!buildCfg){

            const webpackCmdParams: string [] = [];

            if(this.isVerbose()){
                // webpackCmdParams.push('--verbose');
            }
            
            this.log(`Building...`);  

            let rwsBuilderPath: string | null = null;
            type RWSBuilderType = ((appRoot: string, buildParams: WorkspaceBuildParams, workspaceDir: string) => Promise<WebpackConfig>) | undefined;
            let rwsBuilder: RWSBuilderType;
            let pkgPath: string = '';

            switch(this.buildType){
                //@ts-ignore
                case BuildType.FRONT: rwsBuilder = ((await import('@rws-framework/client/builder/webpack/rws.webpack.config.js')).default) as any; pkgPath = '@rws-framework/client'; break;
                //@ts-ignore
                case BuildType.BACK: rwsBuilder = ((await import('@rws-framework/server/rws.webpack.config.js')).default) as any; pkgPath = '@rws-framework/server'; break;
                //@ts-ignore
                case BuildType.CLI: rwsBuilder = ((await import('@rws-framework/server/cli.rws.webpack.config.js')).default) as any; pkgPath = '@rws-framework/server'; break;
            }            

            if(!rwsBuilder || pkgPath === ''){
                throw new Error(`Builder couldn't find webpack loader from ${this.buildType}`);
            }

            type WorkspaceBuildParams = Omit<IFrontendConfig & IBackendConfig & ICLIConfig, 'workspaceDir'> & { dev: boolean, tsConfig: TSConfigContent; };

            const cfg = this.config.get();
            const workspaceCfg: IFrontendConfig & IBackendConfig & ICLIConfig | undefined = cfg.build[this.buildType];

            if(!workspaceCfg){
                throw new Error('[RWS] Workspace config error.');
            }

            const workDir = path.resolve(this.appRootPath, workspaceCfg.workspaceDir);

            const tsConfig: TSConfigContent = TSConfigHelper.create<TSConfigHelper>().build(                
                this.appRootPath,
                pkgPath,
                this.config,
                this.buildType
            );            

            const buildCfg: WebpackConfig = await rwsBuilder(this.appRootPath, {      
              dev: cfg.dev || false,
              entrypoint: workspaceCfg.entrypoint || './src/index.ts',
              executionDir: workDir,
              outputDir:  workspaceCfg?.outputDir || './build',
              outputFileName: workspaceCfg?.outputFileName || `${this.buildType.toLowerCase()}.rws.js`,
              tsConfig,
              publicDir:  workspaceCfg?.publicDir,                               
             
              //front
              parted: workspaceCfg?.parted,
              partedDirUrlPrefix: workspaceCfg?.partedDirUrlPrefix,    
              copyAssets: workspaceCfg?.copyAssets,
              env: workspaceCfg?.env,     

              //front debug
              hotReload: workspaceCfg?.hotReload,
              pkgReport: workspaceCfg?.pkgReport,         
            }, path.resolve(this.appRootPath, 'node_modules', pkgPath));

            if(!watch){
                await this.execute(buildCfg);
            }else{           
                // concurrently([
                //     { command: `nodemon --watch ${path.basename(path.dirname(this.config.getOutputFilePath(this.appRootPath, this.buildType as Exclude<BuildType, BuildType.ALL>)))}`, name: 'app', cwd: this.workspacePath },
                //     { command: `webpack --config ${webpackFileConfigPath}${this.produceParamString(webpackCmdParams)} --watch`, name: 'webpack', cwd: this.workspacePath }
                //     ], {
                //     prefix: 'name',
                //     killOthers: ['failure', 'success'],
                //     restartTries: 3
                // });  
            }

            this.log(`Build complete.`);
        }else{
           
        }
    }

    async execute(buildCfg: WebpackConfig, callback: (buildCfg: WebpackConfig) => Promise<void> = async (buildCfg: WebpackConfig) => void 0): Promise<void>
    {
        await new Promise<void>((resolve, reject) => {
            const compiler = webpack(buildCfg);
            compiler.run((err, stats) => {   
                if(err){ 
                    reject(err)
                    console.error(err);
                }
                compiler.close((cerr) => {
                    if(cerr){ 
                        reject(cerr)
                        console.error(cerr);
                    }
                });
                
                resolve(); 
            });
        });

        await callback(buildCfg);
    }
}