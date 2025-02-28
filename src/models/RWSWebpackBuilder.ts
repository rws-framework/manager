import { RWSBuilder } from './_builder';
import path from 'path';
import type { Compiler, Stats, Configuration as WebpackConfig } from 'webpack';
import webpack from 'webpack';
import fs from 'fs';
import { BuildersConfigurations, IBackendConfig, ICLIConfig, IFrontendConfig, IWebpackRWSConfig } from '../types/manager';
import { BuildType, Environment, ManagerRunOptions, RunnableConfig } from '../types/run';
import { TSConfigData } from '../types/tsc';

import { TSConfigHelper } from '../helper/TSConfigHelper';
import { ChildProcess, spawn } from 'child_process';
import { RWSRunner } from './RWSRunner';
import chalk from 'chalk';


export class RWSWebpackBuilder extends RWSBuilder<WebpackConfig> {
    private serverProcess: ChildProcess | null = null;

    async build(watch: boolean = false): Promise<void> {              
        const workspaceSection = this.config.get().build[this.buildType] as RunnableConfig;
        const buildersConfig: BuildersConfigurations | undefined = workspaceSection ? workspaceSection?._builders : undefined;
        const configBuildSection = buildersConfig ? buildersConfig[this.TYPE as keyof BuildersConfigurations] as IWebpackRWSConfig : null
        const buildCfg =  configBuildSection && configBuildSection.config ? configBuildSection.config  : null;

        if(!buildCfg){

            const webpackCmdParams: string [] = [];

            if(this.isVerbose()){
                // webpackCmdParams.push('--verbose');
            }
            
            this.log(`Building...`);  

            const {  
                workDir,
                workspaceCfg,
                cfg,
                rwsBuilder,
                pkgPath
            } = await this.getBuildData();

            const tsConfigControls = TSConfigHelper.create<TSConfigHelper>(this.config).build(                
                this.appRootPath,                
                this.buildType
            );            

            const buildCfg: WebpackConfig = await rwsBuilder(this.appRootPath, {   
              environment: workspaceCfg.environment || Environment.NODE,
              dev: cfg.dev || false,
              devtools: cfg.dev ? 'source-map' : false,
              entrypoint: workspaceCfg.entrypoint || './src/index.ts',
              executionDir: workDir,
              outputDir:  workspaceCfg?.outputDir || './build',
              outputFileName: workspaceCfg?.outputFileName || `${this.buildType.toLowerCase()}.rws.js`,
              tsConfig: tsConfigControls.tsConfig as any,
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

     
            await this.execute(buildCfg, watch);

            tsConfigControls.remove();

            this.log(`Build complete.`);
        }else{
           
        }
    }

    async getBuildData() {
        type WorkspaceBuildParams = Omit<IFrontendConfig & IBackendConfig & ICLIConfig, 'workspaceDir'> & { dev: boolean, tsConfig: (pkgPath: string, fileCreation?: boolean) => TSConfigData; };
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


        const cfg = this.config.get();
        const workspaceCfg = cfg.build[this.buildType] as Omit<
            IFrontendConfig & 
            IBackendConfig & 
            ICLIConfig
        , 'environment'> & { environment: Environment };

        if(!workspaceCfg){
            throw new Error(`[RWS ERROR] The "${this.buildType}" workspace config error.`);
        }

        const workDir = path.resolve(this.appRootPath, workspaceCfg.workspaceDir);

        return {
            workDir,
            workspaceCfg,
            cfg,
            rwsBuilder,
            pkgPath
        }
    }

    private async restartServer(): Promise<void> {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
        }

        const outputPath = this.config.getOutputFilePath(
            this.appRootPath,
            this.buildType as Exclude<BuildType, BuildType.ALL>
        );

        this.serverProcess = spawn('node', [outputPath], {
            stdio: 'inherit',
            cwd: this.workspacePath
        });

        this.serverProcess.on('error', (err) => {
            console.error('Failed to start server:', err);
        });
    }

    async execute(buildCfg: WebpackConfig, watch: boolean = false): Promise<void> {
        const _self = this;

        await new Promise<void>( async function (resolve, reject){
            const compiler = webpack(buildCfg);                
                
            if (watch) {
                _self.compileWatch(compiler, {resolve, reject});
            } else {
                _self.compile(compiler, {resolve, reject});
            }
        });
    
        if(this.theManager.hasOption(ManagerRunOptions.RUN)){
            this.log(chalk.yellow(`--${ManagerRunOptions.RUN} option detected.`) + ' starting runfile...');
            
            const runner = new RWSRunner({
                appRootPath: this.appRootPath,
                isVerbose: this.isVerbose()
            }, this.config);
    
            if (RWSRunner.RUNNABLE_WORKSPACES.includes(this.buildType)) {
                runner.checkRunnable(this.buildType).run(this.buildType);
            }
        }
    
        return;
    }

    private compileWatch(compiler: Compiler, { resolve, reject } : { 
        resolve: () => void, 
        reject: (err: Error | null) => void
     })
    {
       
        const _self = this;
        compiler.watch({}, async function (err: Error | null, stats?: Stats) {
            const success = await _self.handleBuildResult(reject, err, stats, true);
            if (success) {                
                resolve();
            }
        });
    }

    private compile(compiler: Compiler, { resolve, reject } : { 
        resolve: () => void, 
        reject: (err: Error | null) => void
     })
    {
        let isFirstRun = true;
        compiler.run(async (err, stats) => {
            const success = await this.handleBuildResult(reject,err, stats);
            
            if (isFirstRun && success && this.buildType === BuildType.FRONT) {
                isFirstRun = false;  
                resolve()             
            }else{
                compiler.close((cerr) => {
                    if (cerr) {
                        reject(cerr);
                        console.error(cerr);
                        return;
                    }
                    resolve();
                });
            }
        });
    }

    private async handleBuildResult(reject: (err: Error | null) => void, err: Error | null, stats: webpack.Stats | undefined, enableServerRestart: boolean = false) {
        if (err) {
            console.error(err);
            reject(err); // Add reject here
            return;
        }

        if (stats?.hasErrors()) {
            const output = stats.toString({ 
                colors: true,
                chunks: false,  // Make the build much less verbose
                modules: false,
                assets: true,
                errorDetails: true // Display error details
            });
            console.error(output);
            reject(new Error('Build failed with errors')); // Add reject here
            return;
        }

        console.log(stats?.toString({ 
            colors: true,
            chunks: false,
            modules: false,
            assets: true
        }));        

        try {
            if (enableServerRestart && this.buildType !== BuildType.FRONT) {
                await this.restartServer();
            }
            return true; // Indicate success
        } catch (error) {
            console.error('Error restarting server:', error);
            reject(error); // Add reject here
            return false;
        }
    };
}