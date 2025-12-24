"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowTrigger = exports.PieceTrigger = exports.EmptyTrigger = exports.FlowTriggerType = exports.PieceTriggerSettings = exports.AUTHENTICATION_PROPERTY_NAME = void 0;
const typebox_1 = require("@sinclair/typebox");
const pieces_1 = require("../../pieces");
const properties_1 = require("../properties");
const sample_data_1 = require("../sample-data");
exports.AUTHENTICATION_PROPERTY_NAME = 'auth';
exports.PieceTriggerSettings = typebox_1.Type.Object({
    sampleData: typebox_1.Type.Optional(sample_data_1.SampleDataSetting),
    propertySettings: typebox_1.Type.Record(typebox_1.Type.String(), properties_1.PropertySettings),
    customLogoUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    pieceName: typebox_1.Type.String({}),
    pieceVersion: pieces_1.VersionType,
    triggerName: typebox_1.Type.Optional(typebox_1.Type.String({})),
    input: typebox_1.Type.Record(typebox_1.Type.String({}), typebox_1.Type.Any()),
});
var FlowTriggerType;
(function (FlowTriggerType) {
    FlowTriggerType["EMPTY"] = "EMPTY";
    FlowTriggerType["PIECE"] = "PIECE_TRIGGER";
})(FlowTriggerType || (exports.FlowTriggerType = FlowTriggerType = {}));
const commonProps = {
    name: typebox_1.Type.String({}),
    valid: typebox_1.Type.Boolean({}),
    displayName: typebox_1.Type.String({}),
    nextAction: typebox_1.Type.Optional(typebox_1.Type.Any()),
};
exports.EmptyTrigger = typebox_1.Type.Object(Object.assign(Object.assign({}, commonProps), { type: typebox_1.Type.Literal(FlowTriggerType.EMPTY), settings: typebox_1.Type.Any() }));
exports.PieceTrigger = typebox_1.Type.Object(Object.assign(Object.assign({}, commonProps), { type: typebox_1.Type.Literal(FlowTriggerType.PIECE), settings: exports.PieceTriggerSettings }));
exports.FlowTrigger = typebox_1.Type.Union([
    exports.PieceTrigger,
    exports.EmptyTrigger,
]);
//# sourceMappingURL=trigger.js.map