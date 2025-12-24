"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropdownState = exports.DropdownOption = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.DropdownOption = typebox_1.Type.Object({
    label: typebox_1.Type.String(),
    value: typebox_1.Type.Unknown(),
});
exports.DropdownState = typebox_1.Type.Object({
    disabled: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    placeholder: typebox_1.Type.Optional(typebox_1.Type.String()),
    options: typebox_1.Type.Array(exports.DropdownOption)
});
//# sourceMappingURL=common.js.map