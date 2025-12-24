"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTemplatesRequestQuery = exports.ListFlowTemplatesRequestQuery = exports.UpdateTemplateRequestBody = exports.UpdateFlowTemplateRequestBody = exports.CreateTemplateRequestBody = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const template_1 = require("./template");
exports.CreateTemplateRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    summary: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(template_1.TemplateTag)),
    blogUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    metadata: (0, common_1.Nullable)(common_1.Metadata),
    author: typebox_1.Type.String(),
    categories: typebox_1.Type.Array(typebox_1.Type.Enum(template_1.TemplateCategory)),
    type: typebox_1.Type.Enum(template_1.TemplateType),
    flows: typebox_1.Type.Optional(typebox_1.Type.Array(template_1.FlowVersionTemplate)),
});
exports.UpdateFlowTemplateRequestBody = typebox_1.Type.Object({
    name: typebox_1.Type.Optional(typebox_1.Type.String()),
    summary: typebox_1.Type.Optional(typebox_1.Type.String()),
    description: typebox_1.Type.Optional(typebox_1.Type.String()),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(template_1.TemplateTag)),
    blogUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    metadata: (0, common_1.Nullable)(common_1.Metadata),
    status: typebox_1.Type.Optional(typebox_1.Type.Enum(template_1.TemplateStatus)),
    categories: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.Enum(template_1.TemplateCategory))),
    flows: typebox_1.Type.Optional(typebox_1.Type.Array(template_1.FlowVersionTemplate)),
});
exports.UpdateTemplateRequestBody = exports.UpdateFlowTemplateRequestBody;
exports.ListFlowTemplatesRequestQuery = typebox_1.Type.Object({
    type: typebox_1.Type.Optional(typebox_1.Type.Enum(template_1.TemplateType)),
    pieces: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    tags: typebox_1.Type.Optional(typebox_1.Type.Array(template_1.TemplateTag)),
    search: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.ListTemplatesRequestQuery = exports.ListFlowTemplatesRequestQuery;
//# sourceMappingURL=template.requests.js.map