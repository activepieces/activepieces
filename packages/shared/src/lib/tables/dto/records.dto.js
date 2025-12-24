"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteRecordsRequest = exports.ListRecordsRequest = exports.Filter = exports.FilterOperator = exports.UpdateRecordRequest = exports.CreateRecordsRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.CreateRecordsRequest = typebox_1.Type.Object({
    records: typebox_1.Type.Array(typebox_1.Type.Array(typebox_1.Type.Object({
        fieldId: typebox_1.Type.String(),
        value: typebox_1.Type.String(),
    }))),
    tableId: typebox_1.Type.String(),
});
exports.UpdateRecordRequest = typebox_1.Type.Object({
    cells: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Object({
        fieldId: typebox_1.Type.String(),
        value: typebox_1.Type.String(),
    }))),
    tableId: typebox_1.Type.String(),
    agentUpdate: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
});
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQ"] = "eq";
    FilterOperator["NEQ"] = "neq";
    FilterOperator["GT"] = "gt";
    FilterOperator["GTE"] = "gte";
    FilterOperator["LT"] = "lt";
    FilterOperator["LTE"] = "lte";
    FilterOperator["CO"] = "co";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
exports.Filter = typebox_1.Type.Object({
    fieldId: typebox_1.Type.String(),
    value: typebox_1.Type.String(),
    operator: typebox_1.Type.Optional(typebox_1.Type.Enum(FilterOperator)),
});
exports.ListRecordsRequest = typebox_1.Type.Object({
    tableId: typebox_1.Type.String(),
    limit: typebox_1.Type.Optional(typebox_1.Type.Number({})),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String({})),
    filters: typebox_1.Type.Optional(typebox_1.Type.Array(exports.Filter)),
});
exports.DeleteRecordsRequest = typebox_1.Type.Object({
    ids: typebox_1.Type.Array(typebox_1.Type.String()),
});
//# sourceMappingURL=records.dto.js.map