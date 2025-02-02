import 'reflect-metadata';

import chalk from 'chalk';
import { getCommandContext } from './_args';
import commands from './commands';
import { BuildType, RWSManager } from '../../src/managers/RWSManager';


async function main(): Promise<void>
{  
  
  const { primaryCommand, secondaryCommand, commandParams, isAfterRebuild } = getCommandContext(commands);
  const startPath = process.cwd();

  const manager = await RWSManager.start(startPath, commandParams);

  if(primaryCommand === 'build'){
    await manager.build(secondaryCommand as BuildType);

    console.log(chalk.bgGreen('[RWS MANAGER] Build complete.'));
  }

  if(primaryCommand === 'run'){
    await manager.run(secondaryCommand as BuildType);

    console.log(chalk.bgGreen('[RWS MANAGER] Run complete.'));
  }
}

console.log(chalk.bgGreen('[RWS MANAGER] Starting systems...'));

main();
