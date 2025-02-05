import { CommandsType } from "./_args"

const commands: CommandsType = {
    build: {
      front: null,
      back: null,
      cli: null
    },
    run: {
      front: null,
      back: null,
      cli: null
    },
    db: {
      init: null
    },
    generate: {
      tsconfig: null
    },
    help: null,
    cli: null
}

export default commands;