import { BaseRWSConfig } from "./manager";

export enum BuildType {
    FRONT = 'front',
    CLI = 'cli',
    BACK = 'back',  
    ALL = 'all'
}

export enum BuilderType {
    WEBPACK = 'webpack',
    VITE = 'vite'    
}

export enum ManagerRunOptions {
    BUILD = 'build',
    WATCH = 'watch',
    VERBOSE = 'verbose',
    RELOAD = 'reload'
}

export enum Environment {
    NODE = 'node',
    BUN = 'bunx',
    DENO = 'deno'
}

export interface RunnableConfig extends BaseRWSConfig {
    environment?: Environment;
    processOptions?: {

    }
}

