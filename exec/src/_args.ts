import chalk from 'chalk';

type SubCommandParams = object;
export type CommandsType = { [key: string]: { [subKey: string]: SubCommandParams | null } | null };

export type CommandContext = {
    primaryCommand: string,
    secondaryCommand: string | null,
    commandParams: string[],
    isAfterRebuild: boolean;
    isVerbose: boolean;
}

export function getCommandContext(commands: CommandsType): CommandContext
{    
    const argv = [...process.argv].slice(2);
    const args: string[] = argv.filter(cmd => cmd !== '--rebuild' && cmd !== '--verbose');    
    const cliExecPath: string = args.pop();   
    const isAfterRebuild: boolean = argv.find(cmd => cmd == '--rebuild') !== null;
    const isVerbose: boolean = argv.find(cmd => cmd == '--verbose') !== null;

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
        commandParams = [...args].slice(2);
    }else{
        commandParams = [...args].slice(1);
    }

    
    return {
        primaryCommand,
        secondaryCommand,
        commandParams,
        isAfterRebuild,
        isVerbose
    }
}