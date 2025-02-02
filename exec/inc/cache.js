const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getParams } = require('./params');


const getCachedPath = (rwsCliConfigDir, key) => {
    return path.resolve(rwsCliConfigDir, key)
};

function needsCacheWarming(rwsCliConfigDir){

    if(!fs.existsSync(getCachedPath('paths', rwsCliConfigDir)) || !fs.existsSync(getCachedPath('checksum', rwsCliConfigDir))){
        return true;
    }
    
    const fileList = fs.readFileSync(getCachedPath('paths', rwsCliConfigDir), 'utf-8').split('\n');    

    if(fileList.length){
        const fileContents = [];
        for(const filePath of fileList){
            if(fs.existsSync(filePath)){
                fileContents.push(fs.readFileSync(filePath, 'utf-8'));
            }
        }
        const finalMD5 = crypto.createHash('md5').update(fileContents.join('\n')).digest('hex');
        const cachedMD5 = fs.readFileSync(getCachedPath('checksum', rwsCliConfigDir), 'utf-8');

        if(finalMD5 === cachedMD5){            
            return false;
        }
    }        

    return true;
}

module.exports = { needsCacheWarming, getCachedPath };