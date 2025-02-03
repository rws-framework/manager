const webpack = require('webpack');
const webpackCfg = require('../../webpack.config');
const chalk = require('chalk');
const fs = require('fs');
const { getCachedPath } = require('./cache');
const path = require('path');
const { tsc, enableTempCfg } = require('./tsbuilder');

async function buildCLI(appRoot, rwsCliConfigDir, currentCwd, isVerbose){
    console.log(chalk.yellow('[RWS CLI] Building CLI client...'));

        const cacheTypes = ['paths', 'checksum'];

        for(const type of cacheTypes){
            if(fs.existsSync(getCachedPath(type, rwsCliConfigDir))){
                fs.unlinkSync(getCachedPath(type, rwsCliConfigDir));
            }
        }      
        
        const tscBuild = await tsc(path.join(__dirname, '..', '..'), appRoot, isVerbose);

        webpackCfg.plugins.push(new webpack.DefinePlugin({
            'process.env.CLI_EXEC': JSON.stringify(currentCwd)
        })) 
       
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

module.exports = { buildCLI, tsc, enableTempCfg }