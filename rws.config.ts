import { IManagerConfig } from './src/index';

export default function(): IManagerConfig {
    return {
        front: {
            entrypoint: './@dev/frontend'           
        },
        back: {
            entrypoint: './@dev/backend'
        }
    }
}