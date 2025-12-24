"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cell = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
exports.Cell = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { recordId: typebox_1.Type.String(), fieldId: typebox_1.Type.String(), projectId: typebox_1.Type.String(), value: typebox_1.Type.Unknown() }));
//# sourceMappingURL=cell.js.map