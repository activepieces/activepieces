"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = tryCatch;
exports.tryCatchSync = tryCatchSync;
const tslib_1 = require("tslib");
// Main wrapper function
function tryCatch(fn) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fn();
            return { data, error: null };
        }
        catch (error) {
            return { data: null, error: error };
        }
    });
}
function tryCatchSync(fn) {
    try {
        const data = fn();
        return { data, error: null };
    }
    catch (error) {
        return { data: null, error: error };
    }
}
//# sourceMappingURL=try-catch.js.map