# Realtime Web Suit CLI helper classes

CLI classes used in RWS packages.


## Usage

See ```./docs``` directory


# @rws-framework/manager

The RWS Manager is the central configuration and build orchestrator for RWS (Realtime Web Suite) projects. It provides a unified way to manage frontend, backend, and CLI build processes, environment variables, and workspace structure.

## Features

- Centralized configuration for frontend, backend, and CLI builds
- Environment variable management (via dotenv)
- TypeScript path mapping and builder customization
- Hot reload and custom output directory support
- Extensible for monorepo and multi-app setups

## Main Configuration: `rws.config.ts`

The main entry point for the manager is the `rws.config.ts` file at the project root. This file exports a function returning an `IManagerConfig` object, which describes all build and environment options for your project.

### Example `rws.config.ts`

```typescript
import { IManagerConfig } from '@rws-framework/manager';
import { rwsPath } from '@rws-framework/console';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(rwsPath.findRootWorkspacePath(), '.env');
const envData = dotenv.config({ path: envPath }); 

if (envData.error) {
    throw envData.error;
}

const env = envData.parsed as {
    FRONT_BUILD_DIR: string
    BACKEND_URL: string,
    WS_URL: string,    
    DEV?: string
};

export default function config(): IManagerConfig {
    return {
        dev: env?.DEV !== undefined && env.DEV === '1',
        build: {
            front: {
                workspaceDir: './frontend',
                outputDir: `${env.FRONT_BUILD_DIR}/js`,
                outputFileName: 'inthub.front.js',
                publicDir: env.FRONT_BUILD_DIR,  
                hotReload: true,           
                cssDir: `${env.FRONT_BUILD_DIR}/css`,  
                _builders: {
                    ts: {
                        includes: [
                            `../backend/src/models/interfaces`,
                            `../backend/src/controllers/types`,
                            `../backend/src/app/acl_module/types`
                        ],
                        paths: {
                            '@front': ['./src'],
                            '@back': ['../backend/src']
                        }    
                    }
                },                                        
                env:{
                    BACKEND_URL: env.BACKEND_URL,
                    WS_URL: env.WS_URL,
                }
            },      
            back: {
                workspaceDir: './backend',
                outputFileName: 'inthub.server.js',
                publicDir: `${env.FRONT_BUILD_DIR}`,
                externalRoutesFiles: [
                    './src/config/routes.ts', 
                    './src/config/open_routes.ts',
                    './src/config/routing/authActions.ts',
                    './src/config/routing/homeActions.ts',
                    './src/config/routing/companyActions.ts',
                    './src/app/acl_module/config/routing/aclActions.ts',
                ],
                _builders: {
                    ts: {
                        paths: {
                            '@back': ['./src']
                        }    
                    }
                },                
            },
            cli: {
                entrypoint: './src/cli.ts',
                workspaceDir: './backend',
                outputFileName: 'inthub.cli.js',                                
            },
            sw: {
                workspaceDir: './frontend',
                swSrcPath: 'src/service_worker/index.ts'
            }
        }
    }
}
```

## Service Worker Support

The manager supports building a TypeScript service worker using the `sw` build type. The service worker is compiled by the `@rws-framework/client` webpack pipeline (`build:sw`) and output to `public/service_worker.js` inside the workspace directory.

### 1. Add `sw` to `rws.config.ts`

```typescript
sw: {
    workspaceDir: './frontend',
    swSrcPath: 'src/service_worker/index.ts'
}
```

### 2. Create the TypeScript service worker

Extend `RWSServiceWorker` from the client package:

```typescript
// frontend/src/service_worker/index.ts
import RWSServiceWorker from '@rws-framework/client/service_worker/src/_service_worker';
import IRWSUser from '@rws-framework/client/src/types/IRWSUser';

const _self = self as unknown as ServiceWorkerGlobalScope;

class MyServiceWorker extends RWSServiceWorker<IRWSUser> {
    private authToken: string | null = null;

    async onInit(): Promise<void> {
        _self.addEventListener('message', (event: ExtendableMessageEvent) => {
            if (!event.data) return;

            if (event.data.command === 'set_token') {
                this.authToken = event.data.params?.token ?? null;
            }
        });

        _self.addEventListener('fetch', (event: FetchEvent) => {
            this.handleFetch(event);
        });
    }

    private handleFetch(event: FetchEvent): void {
        const url = new URL(event.request.url);

        // Intercept /uploads/* and inject Bearer token
        if (!url.pathname.startsWith('/uploads/') || !this.authToken) {
            return;
        }

        const modifiedHeaders = new Headers(event.request.headers);
        modifiedHeaders.set('Authorization', `Bearer ${this.authToken}`);

        event.respondWith(fetch(new Request(event.request, { headers: modifiedHeaders })));
    }
}

MyServiceWorker.create(_self);
```

### 3. Register the service worker and send token from the frontend app

```typescript
import ServiceWorkerService from '@rws-framework/client/src/services/ServiceWorkerService';

// On app start
await swService.registerServiceWorker();

// Send token whenever the user logs in or token is restored from storage
swService.sendDataToServiceWorker('set_token', { token }, 'auth');
```

### 4. Build

```bash
yarn rws build sw
```

## Configuration Options

- `dev`: Enable development mode (hot reload, etc)
- `build.front`: Frontend build options
  - `workspaceDir`: Path to frontend source
  - `outputDir`: Output directory for built JS
  - `outputFileName`: Name of the frontend bundle
  - `publicDir`: Directory for static/public assets
  - `hotReload`: Enable hot reload for frontend
  - `cssDir`: Directory for built CSS
  - `_builders.ts.includes`: Extra TypeScript include paths
  - `_builders.ts.paths`: TypeScript path mappings
  - `env`: Environment variables injected into frontend build
- `build.back`: Backend build options
  - `workspaceDir`: Path to backend source
  - `outputFileName`: Name of backend bundle
  - `publicDir`: Directory for backend public assets
  - `externalRoutesFiles`: Array of route/config files to include
  - `_builders.ts.paths`: TypeScript path mappings for backend
- `build.cli`: CLI build options
  - `entrypoint`: Path to CLI entry file
  - `workspaceDir`: Path to CLI/command source
  - `outputFileName`: Name of CLI bundle
- `build.sw`: Service Worker build options
  - `workspaceDir`: Path to workspace containing the service worker source (usually `./frontend`)
  - `swSrcPath`: Path to the TypeScript entry file relative to `workspaceDir` (e.g. `src/service_worker/index.ts`)

### Example: Frontend Builder Paths
```json
"_builders": {
  "ts": {
    "includes": [
      "../backend/src/models/interfaces",
      "../backend/src/controllers/types"
    ],
    "paths": {
      "@front": ["./src"],
      "@back": ["../backend/src"]
    }
  }
}
```

### Example: Backend External Routes
```json
"externalRoutesFiles": [
  "./src/config/routes.ts",
  "./src/config/open_routes.ts",
  "./src/config/routing/authActions.ts"
]
```

See the `IManagerConfig` type for all advanced options and nested builder settings.

## Usage

1. Place your `rws.config.ts` at the root of your project.
2. Use the RWS CLI or build tools to run builds, referencing this config.
3. Customize the config for your workspace structure, output needs, and environment.

## Best Practices

- Keep all build and environment config in `rws.config.ts` for consistency.
- Use environment variables for sensitive or environment-specific values.
- Leverage TypeScript path mapping for clean imports across frontend and backend.
- Use the `includes` and `externalRoutesFiles` arrays to share types and routes between apps.

### Extended Example: `rws.config.ts`

Below is a more advanced example showing additional options from the config types, including aliases, custom environment variables, asset copying, and advanced builder settings.

```typescript
import { IManagerConfig } from '@rws-framework/manager';
import { rwsPath } from '@rws-framework/console';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(rwsPath.findRootWorkspacePath(), '.env');
const envData = dotenv.config({ path: envPath });
if (envData.error) throw envData.error;
const env = envData.parsed as any;

export default function config(): IManagerConfig {
    return {
        dev: env?.DEV === '1',
        build: {
            front: {
                workspaceDir: './frontend',
                outputDir: `${env.FRONT_BUILD_DIR}/js`,
                outputFileName: 'inthub.front.js',
                publicDir: env.FRONT_BUILD_DIR,
                hotReload: true,
                cssDir: `${env.FRONT_BUILD_DIR}/css`,
                parted: true,
                partedDirUrlPrefix: '/static/',
                aliases: {
                    '@front': './src',
                    '@shared': '../shared/src'
                },
                copyAssets: {
                    './assets': ['./src/assets', './src/images']
                },
                env: {
                    BACKEND_URL: env.BACKEND_URL,
                    WS_URL: env.WS_URL,
                    DOMAIN: env.DOMAIN,
                    CUSTOM_VAR: env.CUSTOM_VAR
                },
                _builders: {
                    ts: {
                        includes: [
                            '../backend/src/models/interfaces',
                            '../backend/src/controllers/types',
                            '../backend/src/app/acl_module/types',
                            '../shared/types'
                        ],
                        paths: {
                            '@front': ['./src'],
                            '@back': ['../backend/src'],
                            '@shared': ['../shared/src']
                        },
                        excludes: ['**/*.test.ts']
                    },
                    webpack: {
                        config: {},
                        nestedNodePackages: ['some-nested-package']
                    }
                }
            },
            back: {
                workspaceDir: './backend',
                outputFileName: 'inthub.server.js',
                publicDir: env.FRONT_BUILD_DIR,
                externalRoutesFiles: [
                    './src/config/routes.ts',
                    './src/config/open_routes.ts',
                    './src/config/routing/authActions.ts',
                    './src/config/routing/homeActions.ts',
                    './src/config/routing/companyActions.ts',
                    './src/app/acl_module/config/routing/aclActions.ts',
                ],
                aliases: {
                    '@back': './src',
                    '@shared': '../shared/src'
                },
                env: {
                    DOMAIN: env.DOMAIN,
                    API_KEY: env.API_KEY
                },
                _builders: {
                    ts: {
                        paths: {
                            '@back': ['./src'],
                            '@shared': ['../shared/src']
                        }
                    },
                    webpack: {
                        config: {},
                        nestedNodePackages: ['some-nested-package'],
                        selfContained: false
                    }
                }
            },
            cli: {
                entrypoint: './src/cli.ts',
                workspaceDir: './backend',
                outputFileName: 'inthub.cli.js',
                env: {
                    CLI_MODE: env.CLI_MODE
                }
            },
            sw: {
                workspaceDir: './frontend',
                swSrcPath: 'src/service_worker/index.ts'
            }
        }
    }
}
```

This example demonstrates:
- Aliases for import paths (`aliases`)
- Custom environment variables for each workspace
- Asset copying for frontend
- Advanced TypeScript and Webpack builder options
- Excluding test files from builds
- Support for shared code between frontend, backend, and CLI

Refer to the `IManagerConfig` and related types for all available options.

## License

MIT