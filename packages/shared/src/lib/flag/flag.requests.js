"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTemplatesCategoriesFlagRequestBody = void 0;
const typebox_1 = require("@sinclair/typebox");
const template_1 = require("../template/template");
exports.UpdateTemplatesCategoriesFlagRequestBody = typebox_1.Type.Object({
    value: typebox_1.Type.Array(typebox_1.Type.Enum(template_1.TemplateCategory)),
});
//# sourceMappingURL=flag.requests.js.map