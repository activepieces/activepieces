"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModelSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.BaseModelSchema = {
    id: typebox_1.Type.String(),
    created: typebox_1.Type.String(),
    update: typebox_1.Type.String(),
};
