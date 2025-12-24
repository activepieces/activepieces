"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureApId = exports.apId = exports.ApId = void 0;
const typebox_1 = require("@sinclair/typebox");
const nanoid_1 = require("nanoid");
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 21;
exports.ApId = typebox_1.Type.String({
    pattern: `^[0-9a-zA-Z]{${ID_LENGTH}}$`,
});
exports.apId = (0, nanoid_1.customAlphabet)(ALPHABET, ID_LENGTH);
const secureApId = (length) => (0, nanoid_1.customAlphabet)(ALPHABET, length)();
exports.secureApId = secureApId;
//# sourceMappingURL=id-generator.js.map