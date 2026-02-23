const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
//we need this script to fix the imports of the d.ts files in the node_modules for the ai piece 
Module._resolveFilename = function (request, parent) {
    const resolved = originalResolveFilename.apply(this, arguments);
    if (resolved.endsWith('.d.ts')) {
        return resolved.replace(/\.d\.ts$/, '.js');
    }
    return resolved;
};
