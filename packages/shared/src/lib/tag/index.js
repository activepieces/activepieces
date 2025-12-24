"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertTagRequest = exports.SetPieceTagsRequest = exports.ListTagsRequest = exports.PieceTag = exports.Tag = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
exports.Tag = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { platformId: typebox_1.Type.String(), name: typebox_1.Type.String() }));
exports.PieceTag = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { pieceName: typebox_1.Type.String(), tagId: typebox_1.Type.String(), platformId: typebox_1.Type.String() }));
exports.ListTagsRequest = typebox_1.Type.Object({
    limit: typebox_1.Type.Optional(typebox_1.Type.Number()),
    cursor: typebox_1.Type.Optional(typebox_1.Type.String()),
});
exports.SetPieceTagsRequest = typebox_1.Type.Object({
    piecesName: typebox_1.Type.Array(typebox_1.Type.String()),
    tags: typebox_1.Type.Array(typebox_1.Type.String()),
});
exports.UpsertTagRequest = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
});
//# sourceMappingURL=index.js.map