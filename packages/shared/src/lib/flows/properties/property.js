"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertySettings = exports.PropertyExecutionType = void 0;
const typebox_1 = require("@sinclair/typebox");
var PropertyExecutionType;
(function (PropertyExecutionType) {
    PropertyExecutionType["MANUAL"] = "MANUAL";
    PropertyExecutionType["DYNAMIC"] = "DYNAMIC";
})(PropertyExecutionType || (exports.PropertyExecutionType = PropertyExecutionType = {}));
exports.PropertySettings = typebox_1.Type.Object({
    type: typebox_1.Type.Enum(PropertyExecutionType),
    schema: typebox_1.Type.Optional(typebox_1.Type.Any()),
});
//# sourceMappingURL=property.js.map