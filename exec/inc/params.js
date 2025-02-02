const path = require('path');

function getParams(){
    const params = process.argv.splice(2);
    let paramsString = params.length ? (' ' + params.join(' ')) : '';
    
    const appRoot = process.cwd();
    const rwsCliConfigDir = path.resolve(appRoot, 'node_modules', '.rws', 'cli');    
    const currentCwd = path.resolve(__dirname, '..');
    const isVerbose = params.find(arg => arg.indexOf('--verbose') > -1) !== null;

    return {
        appRoot,
        rwsCliConfigDir,
        currentCwd,
        isVerbose,
        params,
        paramsString
    }
}



module.exports = { getParams }