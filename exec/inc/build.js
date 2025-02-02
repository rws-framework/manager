const webpack = require('webpack');
const webpackCfg = require('../webpack.config');
const chalk = require('chalk');
const fs = require('fs');
const { getCachedPath } = require('./cache');
const path = require('path');
const { rwsShell } = require('@rws-framework/console');

async function buildCLI(appRoot, rwsCliConfigDir, isVerbose){
    console.log(chalk.yellow('[RWS CLI] Building CLI client...'));

        const cacheTypes = ['paths', 'checksum'];

        for(const type of cacheTypes){
            if(fs.existsSync(getCachedPath(type, rwsCliConfigDir))){
                fs.unlinkSync(getCachedPath(type, rwsCliConfigDir));
            }
        }      
        
        const tscBuild = await tsc(path.join(__dirname, '..'), appRoot, isVerbose);
       
        try {
            await  new Promise((resolve) => {
                webpack(webpackCfg).run((webpackBuildData) => {
                    resolve();
                });
            });
        } catch (e) {
            throw new Error(`Webpack build error: ${e.message}\n${e.stack}`)
        }

        tscBuild.remove();

        console.log(chalk.green('[RWS CLI] CLI client generated'));
}

async function tsc(execPath, appRootPath, isVerbose = false, extendedConfig = {})
{      
    const tempCfg = enableTempCfg(execPath, appRootPath, extendedConfig);   
    const extendedConfigString = extendedConfig ? ` -p ${tempCfg.build().tempConfigPath}` : '';  
    await rwsShell.runCommand(`npx tsc${extendedConfigString}`, execPath, !isVerbose);

    return {
        remove: tempCfg.remove
    }         
}

function enableTempCfg(execPath, appRootPath, cfg = {}){   
    // console.log(path.relative(execPath, path.join(appRootPath, 'rws.config.ts')));
    const tempConfigContent = {
        extends: "./tsconfig.json",
        compilerOptions: {
            baseUrl: ".",
            paths: {
                // Mirror webpack aliases to TypeScript paths
                "@V/*": [path.relative(execPath, './build') + "/*"],
                "@/*": [path.relative(execPath, appRootPath) + "/*"],
                // Add base paths for non-wildcard imports
                "@V": [path.relative(execPath, './build')],
                "@": [path.relative(execPath, appRootPath)]
            }
        },        
        include: [
            path.relative(execPath, path.join(appRootPath, 'rws.config.ts'))
        ],
        exclude: [
            path.relative(execPath, path.join(appRootPath, 'node_modules'), path.join(appRootPath, 'build'))
        ],
        ...cfg
    };    
    
    const tempConfigPath = path.join(execPath, '.tmp.gitignore.json');

    return {
        build: () => {            
            fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfigContent, null, 2));

            return {
                tempConfigPath,
                tempConfigContent
            }
        },
        remove: () => {
            fs.unlinkSync(tempConfigPath);
        }
    }
}

module.exports = { buildCLI, tsc, enableTempCfg }