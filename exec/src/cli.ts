import 'reflect-metadata';

import chalk from 'chalk';
import { getCommandContext } from './_args';
import commands from './commands';
import { RWSManager } from '../../src/managers/RWSManager';
import { BuildType } from '../../src/types/run';


async function main(): Promise<void>
{  
  
  const { primaryCommand, secondaryCommand, commandParams, commandOptions, isAfterRebuild } = getCommandContext(commands);

  const manager = await RWSManager.start(commandParams, commandOptions);

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
