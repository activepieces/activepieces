"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionSchema = exports.LoopOnItemsActionSchema = exports.StorageActionSchema = exports.StoreOperation = exports.PieceActionSchema = exports.CodeActionSchema = exports.ActionType = void 0;
const typebox_1 = require("@sinclair/typebox");
var ActionType;
(function (ActionType) {
    ActionType["CODE"] = "CODE";
    ActionType["STORAGE"] = "STORAGE";
    ActionType["PIECE"] = "PIECE";
    ActionType["LOOP_ON_ITEMS"] = "LOOP_ON_ITEMS";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
exports.CodeActionSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(ActionType.CODE),
    settings: typebox_1.Type.Object({
        artifactSourceId: typebox_1.Type.String({}),
        input: typebox_1.Type.Object({}),
    }),
});
exports.PieceActionSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(ActionType.PIECE),
    settings: typebox_1.Type.Object({
        pieceName: typebox_1.Type.String({}),
        actionName: typebox_1.Type.String({}),
        input: typebox_1.Type.Object({}),
    }),
});
// Storage Action
var StoreOperation;
(function (StoreOperation) {
    StoreOperation["PUT"] = "PUT";
    StoreOperation["GET"] = "GET";
})(StoreOperation = exports.StoreOperation || (exports.StoreOperation = {}));
exports.StorageActionSchema = typebox_1.Type.Union([
    typebox_1.Type.Object({
        name: typebox_1.Type.String({}),
        displayName: typebox_1.Type.String({}),
        type: typebox_1.Type.Literal(ActionType.STORAGE),
        settings: typebox_1.Type.Object({
            operation: typebox_1.Type.Literal(StoreOperation.PUT),
            key: typebox_1.Type.String({
                minLength: 1,
            }),
            value: typebox_1.Type.Any({}),
        }),
    }),
    typebox_1.Type.Object({
        name: typebox_1.Type.String({}),
        displayName: typebox_1.Type.String({}),
        type: typebox_1.Type.Literal(ActionType.STORAGE),
        settings: typebox_1.Type.Object({
            operation: typebox_1.Type.Literal(StoreOperation.GET),
            key: typebox_1.Type.String({
                minLength: 1,
            }),
        }),
    }),
]);
exports.LoopOnItemsActionSchema = typebox_1.Type.Object({
    name: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    type: typebox_1.Type.Literal(ActionType.STORAGE),
    settings: typebox_1.Type.Object({
        items: typebox_1.Type.Array(typebox_1.Type.Any({})),
    }),
});
exports.ActionSchema = typebox_1.Type.Union([
    exports.CodeActionSchema,
    exports.PieceActionSchema,
    exports.StorageActionSchema,
    exports.LoopOnItemsActionSchema,
]);
