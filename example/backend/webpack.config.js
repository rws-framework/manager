const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const { rwsPath } = require('@rws-framework/console');
// Get CLI arguments
const args = process.argv.slice(2);
const fs = require('fs');
const appRootPath = process.env.APP_ROOT || process.cwd();

const internalCwd = process.cwd()
const rootPackageNodeModules = path.resolve(rwsPath.findRootWorkspacePath(), 'node_modules');
const thisPackage = path.resolve(__dirname, '..');
const WEBPACK_PLUGINS = [new webpack.optimize.ModuleConcatenationPlugin()];

const modules_setup = [rootPackageNodeModules];
const isDev = true;
const isVerbose = process.env.VERBOSE === 1 ?? null;

function prettyLog(data){
  if(!isVerbose){
    return;
  }

  for(const key of Object.keys(data)){
    const valObject = data[key];

    console.log(`${chalk.yellow('[Log]')} ${chalk.blue(key)}:`, valObject)
  }
}


const mainEntry = './src/index.ts';
const vPath = path.join(__dirname, 'build');

prettyLog({ backendBuild:{
  thisPackage,
  rootPackageNodeModules,
  appRootPath,
  internalCwd,
  vPath,
  mainEntry  
}});


const cfgExport = {
  context: __dirname,
  entry: mainEntry,
  mode: isDev ? 'development' : 'production',
  target: 'node',
  devtool: isDev ? 'source-map' : false,
  output: {
    path: path.resolve(__dirname, 'build'), // Resolve output path relative to config directory
    filename: '[name].cli.rws.js',
    sourceMapFilename: '[file].map',
    chunkFilename: "[name].chunk.js",
    libraryTarget: 'commonjs2',
    clean: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: modules_setup,
    alias: {       
      '@V': vPath,
      '@': path.resolve(appRootPath, 'src'), // Add explicit resolution for src directory
    },    
    fallback: {
      "kerberos": false,
      "mongodb-client-encryption": false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        use: [                       
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              compilerOptions: {
                outDir: path.resolve(internalCwd, 'build'),       
              }             
            }
          }
        ],
        include: [
          path.resolve(appRootPath),
          path.resolve(thisPackage),
          path.resolve(rootPackageNodeModules, '@rws-framework')                
        ],
        exclude: [
          /node_modules\/(?!(@rws-framework)\/).*/,
          /\.d\.ts$/
        ]
      },       
      {
        test: /\.node$/,
        use: 'node-loader',
      }        
    ],
  },
  plugins: [
    ...WEBPACK_PLUGINS,
  ],  
  optimization: {      
    minimize: false
  },
  experiments: {
    topLevelAwait: true, // Enable top-level await if needed
  }  
  // stats: 'verbose'

};

cfgExport.externals = {
  '@nestjs/common': 'commonjs @nestjs/common',
  '@nestjs/core': 'commonjs @nestjs/core',  
  '@nestjs/config': 'commonjs @nestjs/config',  
  '@anthropic-ai/sdk': 'commonjs @anthropic-ai/sdk',
  '@zip.js/zip.js': 'commonjs @zip.js/zip.js',
  'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
  'uuid': 'commonjs uuid',
  'source-map-support': 'commonjs source-map-support'
};

cfgExport.plugins.push(
  new webpack.BannerPlugin({
    banner: 'require("source-map-support").install();',
    raw: true
  })
);

module.exports = cfgExport;
