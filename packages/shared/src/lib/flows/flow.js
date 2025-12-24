"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulatedTriggerSource = exports.PopulatedFlow = exports.Flow = exports.flowExecutionStateKey = exports.FlowOperationStatus = exports.FlowStatus = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
const metadata_1 = require("../common/metadata");
const trigger_1 = require("../trigger");
const flow_version_1 = require("./flow-version");
var FlowStatus;
(function (FlowStatus) {
    FlowStatus["ENABLED"] = "ENABLED";
    FlowStatus["DISABLED"] = "DISABLED";
})(FlowStatus || (exports.FlowStatus = FlowStatus = {}));
var FlowOperationStatus;
(function (FlowOperationStatus) {
    FlowOperationStatus["NONE"] = "NONE";
    FlowOperationStatus["DELETING"] = "DELETING";
    FlowOperationStatus["ENABLING"] = "ENABLING";
    FlowOperationStatus["DISABLING"] = "DISABLING";
})(FlowOperationStatus || (exports.FlowOperationStatus = FlowOperationStatus = {}));
const flowExecutionStateKey = (flowId) => `flow-execution-state:${flowId}`;
exports.flowExecutionStateKey = flowExecutionStateKey;
exports.Flow = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { projectId: typebox_1.Type.String(), externalId: typebox_1.Type.String(), folderId: (0, base_model_1.Nullable)(typebox_1.Type.String()), status: typebox_1.Type.Enum(FlowStatus), publishedVersionId: (0, base_model_1.Nullable)(typebox_1.Type.String()), metadata: (0, base_model_1.Nullable)(metadata_1.Metadata), operationStatus: typebox_1.Type.Enum(FlowOperationStatus), timeSavedPerRun: (0, base_model_1.Nullable)(typebox_1.Type.Number()) }));
exports.PopulatedFlow = typebox_1.Type.Composite([
    exports.Flow,
    typebox_1.Type.Object({
        version: flow_version_1.FlowVersion,
        triggerSource: typebox_1.Type.Optional(typebox_1.Type.Pick(trigger_1.TriggerSource, ['schedule'])),
    }),
]);
exports.PopulatedTriggerSource = typebox_1.Type.Composite([
    trigger_1.TriggerSource,
    typebox_1.Type.Object({
        flow: exports.Flow,
    }),
]);
//# sourceMappingURL=flow.js.map