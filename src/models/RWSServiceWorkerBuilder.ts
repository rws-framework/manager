import { RWSBuilder } from './_builder';
import path from 'path';
import { IServiceWorkerConfig } from '../types/manager';
import { BuildType } from '../types/run';
import chalk from 'chalk';

export class RWSServiceWorkerBuilder extends RWSBuilder<null> {
    async build(watch: boolean = false): Promise<void> {
        const workspaceCfg = this.config.getBuildTypeSection(BuildType.SW) as unknown as IServiceWorkerConfig;

        if (!workspaceCfg?.swSrcPath) {
            throw new Error('[RWS SW Builder] "swSrcPath" is required in the sw build config.');
        }

        const swAbsPath = path.resolve(this.appRootPath, workspaceCfg.workspaceDir, workspaceCfg.swSrcPath);

        console.log(`${chalk.green('[RWS SW Builder]')} Building service worker from ${chalk.blue(swAbsPath)}`);

        await this.runCommand(
            `yarn rws-client build:sw ${swAbsPath}`,
            path.resolve(this.appRootPath, workspaceCfg.workspaceDir),
        );

        console.log(`${chalk.green('[RWS SW Builder]')} Service worker built successfully.`);
    }

    protected async execute(): Promise<void> {
        // Delegated to build()
    }
}
