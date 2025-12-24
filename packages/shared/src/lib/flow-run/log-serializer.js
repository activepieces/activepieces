"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSerializer = void 0;
const tslib_1 = require("tslib");
exports.logSerializer = {
    serialize(log) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Buffer.from(JSON.stringify(log, null));
        });
    },
};
//# sourceMappingURL=log-serializer.js.map