"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulatedTable = exports.Table = exports.TableAutomationStatus = exports.TableAutomationTrigger = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const field_1 = require("./field");
var TableAutomationTrigger;
(function (TableAutomationTrigger) {
    TableAutomationTrigger["ON_NEW_RECORD"] = "ON_NEW_RECORD";
    TableAutomationTrigger["ON_UPDATE_RECORD"] = "ON_UPDATE_RECORD";
})(TableAutomationTrigger || (exports.TableAutomationTrigger = TableAutomationTrigger = {}));
var TableAutomationStatus;
(function (TableAutomationStatus) {
    TableAutomationStatus["ENABLED"] = "ENABLED";
    TableAutomationStatus["DISABLED"] = "DISABLED";
})(TableAutomationStatus || (exports.TableAutomationStatus = TableAutomationStatus = {}));
exports.Table = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { name: typebox_1.Type.String(), projectId: typebox_1.Type.String(), externalId: typebox_1.Type.String(), status: (0, common_1.NullableEnum)(typebox_1.Type.Enum(TableAutomationStatus)), trigger: (0, common_1.NullableEnum)(typebox_1.Type.Enum(TableAutomationTrigger)) }));
exports.PopulatedTable = typebox_1.Type.Composite([
    exports.Table,
    typebox_1.Type.Object({
        fields: typebox_1.Type.Array(field_1.Field),
    }),
]);
//# sourceMappingURL=table.js.map