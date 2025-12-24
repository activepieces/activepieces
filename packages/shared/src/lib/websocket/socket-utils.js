"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitWithAck = void 0;
const tslib_1 = require("tslib");
const common_1 = require("../common");
const emitWithAck = (socket, event, data, options) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const timeoutMs = (_a = options === null || options === void 0 ? void 0 : options.timeoutMs) !== null && _a !== void 0 ? _a : 4000;
    const retries = (_b = options === null || options === void 0 ? void 0 : options.retries) !== null && _b !== void 0 ? _b : 3;
    const retryDelayMs = (_c = options === null || options === void 0 ? void 0 : options.retryDelayMs) !== null && _c !== void 0 ? _c : 2000;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const result = yield (0, common_1.tryCatch)(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            if (!socket || !socket.connected) {
                throw new Error('Socket not connected');
            }
            return yield socket.timeout(timeoutMs).emitWithAck(event, data);
        }));
        if (result.error) {
            if (attempt < retries) {
                yield new Promise(resolve => setTimeout(resolve, retryDelayMs));
            }
            else {
                throw result.error;
            }
        }
        else {
            return result.data;
        }
    }
    throw new Error(`Failed to emit event after ${retries} retries`);
});
exports.emitWithAck = emitWithAck;
//# sourceMappingURL=socket-utils.js.map