"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedTemplate = exports.Template = exports.TemplateStatus = exports.FlowVersionTemplate = exports.TemplateCategory = exports.TemplateType = exports.TemplateTag = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const flow_version_1 = require("../flows/flow-version");
exports.TemplateTag = typebox_1.Type.Object({
    title: typebox_1.Type.String(),
    color: common_1.ColorHex,
    icon: typebox_1.Type.Optional(typebox_1.Type.String()),
});
var TemplateType;
(function (TemplateType) {
    TemplateType["OFFICIAL"] = "OFFICIAL";
    TemplateType["SHARED"] = "SHARED";
    TemplateType["CUSTOM"] = "CUSTOM";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["ANALYTICS"] = "ANALYTICS";
    TemplateCategory["COMMUNICATION"] = "COMMUNICATION";
    TemplateCategory["CONTENT"] = "CONTENT";
    TemplateCategory["CUSTOMER_SUPPORT"] = "CUSTOMER_SUPPORT";
    TemplateCategory["DEVELOPMENT"] = "DEVELOPMENT";
    TemplateCategory["E_COMMERCE"] = "E_COMMERCE";
    TemplateCategory["FINANCE"] = "FINANCE";
    TemplateCategory["HR"] = "HR";
    TemplateCategory["IT_OPERATIONS"] = "IT_OPERATIONS";
    TemplateCategory["MARKETING"] = "MARKETING";
    TemplateCategory["PRODUCTIVITY"] = "PRODUCTIVITY";
    TemplateCategory["SALES"] = "SALES";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
exports.FlowVersionTemplate = typebox_1.Type.Omit(flow_version_1.FlowVersion, ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles']);
var TemplateStatus;
(function (TemplateStatus) {
    TemplateStatus["PUBLISHED"] = "PUBLISHED";
    TemplateStatus["ARCHIVED"] = "ARCHIVED";
})(TemplateStatus || (exports.TemplateStatus = TemplateStatus = {}));
exports.Template = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { name: typebox_1.Type.String(), type: typebox_1.Type.Enum(TemplateType), summary: typebox_1.Type.String(), description: typebox_1.Type.String(), tags: typebox_1.Type.Array(exports.TemplateTag), blogUrl: (0, common_1.Nullable)(typebox_1.Type.String()), metadata: (0, common_1.Nullable)(common_1.Metadata), usageCount: typebox_1.Type.Number(), author: typebox_1.Type.String(), categories: typebox_1.Type.Array(typebox_1.Type.Enum(TemplateCategory)), pieces: typebox_1.Type.Array(typebox_1.Type.String()), platformId: (0, common_1.Nullable)(typebox_1.Type.String()), flows: typebox_1.Type.Optional(typebox_1.Type.Array(exports.FlowVersionTemplate)), status: typebox_1.Type.Enum(TemplateStatus) }));
exports.SharedTemplate = (0, typebox_1.Omit)(exports.Template, ['platformId', 'id', 'created', 'updated', 'usageCount']);
//# sourceMappingURL=template.js.map