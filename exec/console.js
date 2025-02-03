#!/usr/bin/env node

const { rwsPath } = require('@rws-framework/console');
const rwsTsc = require('@rws-framework/tsc');
const path = require('path');
const chalk = require('chalk');

async function main()
{        
    await rwsTsc.transpile({
        runspaceDir: __dirname, 
        entries: {
            main: './src/cli.ts'
        },
        tsPaths: {
            '@rws-config': [path.join(rwsPath.findRootWorkspacePath(), 'rws.config.ts')]
        },
        isDev: true
    });
}

main();