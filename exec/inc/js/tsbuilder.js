const fs = require('fs');
const path = require('path');
const { rwsShell } = require('@rws-framework/console');

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
            path.relative(execPath, path.join(appRootPath, 'node_modules'))
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

module.exports = {tsc, enableTempCfg};