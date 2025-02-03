const path = require('path');

const webpackRelatedExternals = [
    /^webpack$/,
    /^webpack\/.+$/,
    /^webpack-sources/,
    /^webpack-dev-server/,
    /^enhanced-resolve/,
    /^tapable/,
    /^watchpack/,
    /^loader-runner/,
    /^schema-utils/,
    /^@webpack-cli/,
    /^webpackbar/
];

// Podstawowe moduły node które webpack może próbować pakować
const nodeBuiltins = [
    'path',
    'fs',
    'crypto',
    'buffer',
    'util',
    'events',
    'stream',
    'string_decoder',
    'assert',
    'os'
];

const webpackInceptionExternals = ({context, request}, callback) => {
    // Debug logging
    if (process.env.DEBUG) {
        console.log(`[Webpack Inception] Processing: ${request} from ${context}`);
    }

    // Sprawdź czy to webpack-related package
    if (webpackRelatedExternals.some(pattern => pattern.test(request))) {
        return callback(null, `commonjs ${request}`);
    }

    // Node.js built-ins
    if (nodeBuiltins.includes(request)) {
        return callback(null, `commonjs ${request}`);
    }

    // Jeśli request zaczyna się od . lub .. to znaczy że to lokalny import
    if (request.startsWith('.') || request.startsWith('..')) {
        return callback();
    }

    // Dla node_modules
    if (request.includes('node_modules')) {
        return callback(null, `commonjs ${request}`);
    }

    // Dla wszystkich innych przypadków, pozwól webpackowi je spakować
    callback();
};

module.exports = {
    webpackInceptionExternals,
    // Możesz też wyeksportować patterns jakbyś chciał ich użyć gdzie indziej
    webpackRelatedExternals,
    nodeBuiltins
};
