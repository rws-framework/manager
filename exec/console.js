#!/usr/bin/env node

const { rwsShell } = require('@rws-framework/console');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const { needsCacheWarming } = require('./inc/js/cache');
const { getParams } = require('./inc/js/params');
const { buildCLI } = require('./inc/js/build');

let {    
    appRoot,
    rwsCliConfigDir,
    currentCwd,
    isVerbose,
    params,
    paramsString
} = getParams();

async function main()
{   
    const oldLog = console.log;
    
    console.log = (data) => {
        if(isVerbose){
            oldLog(data);
        }
    }

    const hasRebuild = paramsString.split(' ').pop().indexOf('--rebuild') > -1;
    const doWarmCache = needsCacheWarming(rwsCliConfigDir) || hasRebuild;  

    if(doWarmCache){
        await buildCLI(appRoot, rwsCliConfigDir, currentCwd, isVerbose);    
    }else{
        console.log(chalk.blue('[RWS CLI CACHE] Starting command from built CLI client.'));
    }    

    let startSlice = hasRebuild ? -1 : paramsString.split(' ').length;
    let endSlice = hasRebuild ? -1 : null ;

    paramsString = [
        ...paramsString.split(' ').slice(0, startSlice), 
        currentCwd, 
        endSlice ? 
            paramsString.split(' ').at(endSlice) 
        : null
    ].filter((item) => item !== null).join(' ');

    await rwsShell.runCommand(`node ${path.join(__dirname, 'build', 'main.cli.rws.js')}${paramsString}`, process.cwd());
}

main().then((data) => {
    console.log(chalk.green('[RWS DB CLI] Command complete.'));
}).catch((e) => {
    console.error(e.message);
});