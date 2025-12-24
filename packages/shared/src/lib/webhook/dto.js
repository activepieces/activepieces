"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookUrlParams = void 0;
const typebox_1 = require("@sinclair/typebox");
const id_generator_1 = require("../common/id-generator");
exports.WebhookUrlParams = typebox_1.Type.Object({
    flowId: id_generator_1.ApId,
});
//# sourceMappingURL=dto.js.map