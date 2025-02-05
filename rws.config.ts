import { IManagerConfig } from './src/index';

export default function(): IManagerConfig {
    return {
        front: {
            entrypoint: './example/frontend'           
        },
        back: {
            entrypoint: './example/backend'
        }
    }
}