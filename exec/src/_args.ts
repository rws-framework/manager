import chalk from 'chalk';

type SubCommandParams = object;
export type CommandsType = { [key: string]: { [subKey: string]: SubCommandParams | null } | null };

export type CommandContext = {
    primaryCommand: string,
    secondaryCommand: string | null,
    commandParams: string[],
    isAfterRebuild: boolean;
}

export function getCommandContext(commands: CommandsType): CommandContext
{    
    const cliExecPath: string = process.argv.pop();    
    const args: string[] = process.argv.slice(2).filter(cmd => cmd !== '--rebuild' && cmd !== cliExecPath);    
    const isAfterRebuild: boolean = process.argv.slice(2).find(cmd => cmd == '--rebuild') !== null;

    if(args.length == 0) {
        throw new Error('RWS Manager needs a command.')
    }
      
    const primaryCommand: keyof CommandsType = args[0];

    
    if(!Object.keys(commands).includes(primaryCommand)) {
        throw new Error(`RWS Manager doesn't have "${primaryCommand} command".\n
        Try one of: \n-${Object.keys(commands).join('\n-')}
        `)
    }

    let secondaryCommand: string | null = null;
    let commandParams: string[] = [];

    if(commands[primaryCommand] !== null && Object.keys(commands[primaryCommand] as object).includes(args[1])){
        secondaryCommand = args[1];
        commandParams = args.slice(2);
    }else if(commands[primaryCommand] == null){
        commandParams = args.slice(1);
    } else {
        throw new Error(`RWS Manager "${primaryCommand}" doesn't have "${args[1]} subcommand".\n
        Try one of: \n          -${chalk.yellow(Object.keys(commands[primaryCommand]).join('\n          -'))}
        `)
    }

    return {
        primaryCommand,
        secondaryCommand,
        commandParams,
        isAfterRebuild
    }
}