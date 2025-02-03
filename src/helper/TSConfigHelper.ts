import fs from 'fs';
import path from 'path';
import { ConfigHelper } from './ConfigHelper';
import { BuildType } from '../types/run';
import Singleton from './_singleton';

import { TSConfigContent } from '../types/tsc';

export class TSConfigHelper extends Singleton {
    build(        
        appRootPath: string,    
        pkgPath: string,
        cfg: ConfigHelper,
        buildType: Exclude<BuildType, BuildType.ALL>
    ): TSConfigContent {
        const execPath = cfg.getCLIExecPath();
        const buildSection =cfg.getBuildTypeSection(buildType);
        const basePath = path.join(appRootPath, buildSection.workspaceDir);
        const baseTSConfig: TSConfigContent = JSON.parse(fs.readFileSync(path.resolve(appRootPath, 'node_modules', pkgPath, 'tsconfig.json'), 'utf-8'));
        const managerTSConfigContent: TSConfigContent = {        
            compilerOptions: {         
                baseUrl: basePath,
                paths: {
                    ...(buildSection._builders?.ts?.paths || {})
                }
            }
        };

        return this.deepMergeTSConfigs(baseTSConfig, managerTSConfigContent);
    }

    private deepMergeTSConfigs(baseConfig: TSConfigContent, overrideConfig: TSConfigContent){
        const merged: TSConfigContent = { ...baseConfig };

        if (overrideConfig.compilerOptions) {
            merged.compilerOptions = {
                ...baseConfig.compilerOptions,
                ...overrideConfig.compilerOptions,
                // Special handling for paths since it's an object of arrays
                paths: {
                    ...(baseConfig.compilerOptions?.paths || {}),
                    ...(overrideConfig.compilerOptions.paths || {})
                }
            };
        }

        if (overrideConfig.include) {
            merged.include = [
                ...(baseConfig.include || []),
                ...overrideConfig.include
            ];
        }

        if (overrideConfig.exclude) {
            merged.exclude = [
                ...(baseConfig.exclude || []),
                ...overrideConfig.exclude
            ];
        }
        
        if (overrideConfig.extends) {
            merged.extends = overrideConfig.extends;
        }

        if (overrideConfig.files) {
            merged.files = [
                ...(baseConfig.files || []),
                ...overrideConfig.files
            ];
        }

        return merged;
    }
}