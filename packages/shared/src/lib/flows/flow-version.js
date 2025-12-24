"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowVersionMetadata = exports.FlowVersion = exports.FlowVersionState = exports.LATEST_FLOW_SCHEMA_VERSION = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
const user_1 = require("../user");
const trigger_1 = require("./triggers/trigger");
exports.LATEST_FLOW_SCHEMA_VERSION = '10';
var FlowVersionState;
(function (FlowVersionState) {
    FlowVersionState["LOCKED"] = "LOCKED";
    FlowVersionState["DRAFT"] = "DRAFT";
})(FlowVersionState || (exports.FlowVersionState = FlowVersionState = {}));
exports.FlowVersion = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { flowId: typebox_1.Type.String(), displayName: typebox_1.Type.String(), trigger: trigger_1.FlowTrigger, updatedBy: (0, base_model_1.Nullable)(typebox_1.Type.String()), valid: typebox_1.Type.Boolean(), schemaVersion: (0, base_model_1.Nullable)(typebox_1.Type.String()), agentIds: typebox_1.Type.Array(typebox_1.Type.String()), state: typebox_1.Type.Enum(FlowVersionState), connectionIds: typebox_1.Type.Array(typebox_1.Type.String()), backupFiles: (0, base_model_1.Nullable)(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())) }));
exports.FlowVersionMetadata = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { flowId: typebox_1.Type.String(), displayName: typebox_1.Type.String(), valid: typebox_1.Type.Boolean(), state: typebox_1.Type.Enum(FlowVersionState), updatedBy: (0, base_model_1.Nullable)(typebox_1.Type.String()), schemaVersion: (0, base_model_1.Nullable)(typebox_1.Type.String()), updatedByUser: (0, base_model_1.Nullable)(user_1.UserWithMetaInformation) }));
//# sourceMappingURL=flow-version.js.map