import { ConfigHelper } from '../helper/ConfigHelper';
import { rwsShell } from "@rws-framework/console";
import { BuilderType, BuildType } from '../managers/RWSManager';
import chalk from 'chalk';
import { IBuilderFactoryParams } from '../helper/BuilderFactory';

export abstract class RWSBuilder<C> {  
    protected workspacePath: string;
    protected appRootPath: string;
    protected buildType: BuildType;
    protected TYPE: BuilderType;
    
    private verbose: boolean;

    constructor(params: IBuilderFactoryParams, protected config: ConfigHelper){
        this.workspacePath = params.workspacePath;
        this.appRootPath = params.appRootPath;
        this.buildType = params.workspaceType;
        this.TYPE = params.builderType;        
    }

    async build(watch: boolean = false): Promise<void>
    {
        throw new Error('Declare build() method');
    }

    protected async runCommand(command: string, cwd?: string | null, silent?: boolean, env?: any)
    {
        return rwsShell.runCommand(command, cwd, silent, env ? { env } : null);
    }

    protected log(msg: string, overVerbose: boolean = false){
        if(!this.isVerbose() && !overVerbose){
            return;
        }

        console.log(`${chalk.yellow('[RWS Builder]')}${chalk.green(`<${this.TYPE}>`)}${chalk.blue(`(${this.buildType})`)} ${msg}`)
    }

    protected isVerbose(): boolean
    {
        return this.verbose;
    }

    protected setVerbose(verbose: boolean): RWSBuilder<C>
    {
        this.verbose = verbose;

        return this;
    }

    protected produceParamString(params: string[]) {
        return params.length ? ` ${params.join(' ')}` : '';
    }
}