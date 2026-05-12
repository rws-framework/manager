import { RWSBuilder } from './_builder';
import path from 'path';
import fs from 'fs';
import { IServiceWorkerConfig } from '../types/manager';
import { BuildType } from '../types/run';
import { TSConfigHelper } from '../helper/TSConfigHelper';
import chalk from 'chalk';

export class RWSServiceWorkerBuilder extends RWSBuilder<null> {
    async build(watch: boolean = false): Promise<void> {
        const workspaceCfg = this.config.getBuildTypeSection(BuildType.SW) as unknown as IServiceWorkerConfig;

        if (!workspaceCfg?.swSrcPath) {
            throw new Error('[RWS SW Builder] "swSrcPath" is required in the sw build config.');
        }

        const workDir = path.resolve(this.appRootPath, workspaceCfg.workspaceDir);
        const commandRunDir = workspaceCfg.publicDir
            ? path.dirname(path.resolve(this.appRootPath, workspaceCfg.publicDir))
            : path.dirname(workDir);
        const swAbsPath = path.resolve(workDir, workspaceCfg.swSrcPath);

        console.log(`${chalk.green('[RWS SW Builder]')} Building service worker from ${chalk.blue(swAbsPath)}`);

        // Generate a proper tsconfig that includes the frontend workspace as rootDir
        const tsconfigPath = this.generateTsConfig(workDir, swAbsPath, workspaceCfg);

        try {
            await this.runCommand(
                `yarn rws-client build:sw ${swAbsPath}`,
                commandRunDir,
                false,
                { ...process.env, SW_TSCONFIG: tsconfigPath }
            );

            console.log(`${chalk.green('[RWS SW Builder]')} Service worker built successfully.`);
        } finally {
            // Clean up generated tsconfig
            if (fs.existsSync(tsconfigPath)) {
                fs.unlinkSync(tsconfigPath);
            }
        }
    }

    private generateTsConfig(workDir: string, swEntryPath: string, workspaceCfg: IServiceWorkerConfig): string {
        const tsconfigPath = path.join(workDir, '.rws.sw.tsconfig.json');
        const rootDirRelative = path.relative(workDir, this.appRootPath);

        const tsConfigContent = {
            compilerOptions: {
                ...TSConfigHelper.create<TSConfigHelper>(this.config).getDefaultCompilerOptions(),
                baseUrl: '.',
                rootDir: rootDirRelative || '.',
                module: 'es2022',
                sourceMap: true,
                outDir: 'dist',
                paths: {
                    ...(workspaceCfg._builders?.ts?.paths || {})
                }
            },
            include: [
                path.relative(workDir, swEntryPath),
                ...(workspaceCfg._builders?.ts?.includes || [])
            ]
        };

        fs.writeFileSync(tsconfigPath, JSON.stringify(tsConfigContent, null, 2));

        return tsconfigPath;
    }

    protected async execute(): Promise<void> {
        // Delegated to build()
    }
}
