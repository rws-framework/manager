#!/usr/bin/env node

const { rwsShell } = require('@rws-framework/console');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const { needsCacheWarming } = require('./inc/cache');
const { getParams } = require('./inc/params');
const { buildCLI } = require('./inc/build');

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
        await buildCLI(appRoot, rwsCliConfigDir, isVerbose);    
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

    await rwsShell.runCommand(`node ${path.join(currentCwd, 'build', 'main.cli.rws.js')}${paramsString}`, process.cwd());
}

main().then((data) => {
    console.log(chalk.green('[RWS DB CLI] Command complete.'));
}).catch((e) => {
    console.error(e.message);
});