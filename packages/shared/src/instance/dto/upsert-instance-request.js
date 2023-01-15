"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertInstanceRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const model_1 = require("../model");
exports.UpsertInstanceRequest = typebox_1.Type.Object({
    collectionId: typebox_1.Type.String(),
    status: typebox_1.Type.Enum(model_1.InstanceStatus),
});
