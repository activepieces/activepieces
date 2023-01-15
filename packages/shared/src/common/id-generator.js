"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apId = void 0;
const nanoid_1 = require("nanoid");
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
exports.apId = (0, nanoid_1.customAlphabet)(alphabet, 21);
