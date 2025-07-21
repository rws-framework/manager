#!/usr/bin/env node

const { rwsPath } = require('@rws-framework/console');
const rwsTsc = require('@rws-framework/tsc');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

async function main()
{        
    const rootDir = rwsPath.findRootWorkspacePath();

    const packageJsonPath = path.join(rootDir, 'package.json');

    if(!fs.existsSync(packageJsonPath)){       
        console.error(chalk.red('Cannot find package.json in the root directory.'));
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const extraNodeModules = [];

    if(packageJson.workspaces){
        for(const workName of packageJson.workspaces){  
            const workPath = path.join(rootDir, workName);
            if(fs.existsSync(workPath)){
                const nodeModulesPath = path.join(workPath, 'node_modules');
                if(fs.existsSync(nodeModulesPath)){
                    extraNodeModules.push(nodeModulesPath);
                }
            }
        }   
    }

    await rwsTsc.transpile({
        runspaceDir: __dirname, 
        entries: {
            main: './src/cli.ts'
        },
        tsPaths: {
            '@rws-config': [path.join(rootDir, 'rws.config.ts')]
        },
        isDev: true,
        extraNodeModules,
        dynamicImports: false,
        dirnameFilenameReplace: false
    });
}

main();