"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteStoreEntryRequest = exports.GetStoreEntryRequest = exports.PutStoreEntryRequest = void 0;
const typebox_1 = require("@sinclair/typebox");
const store_entry_1 = require("../store-entry");
exports.PutStoreEntryRequest = typebox_1.Type.Object({
    key: typebox_1.Type.String({
        maxLength: store_entry_1.STORE_KEY_MAX_LENGTH,
    }),
    value: typebox_1.Type.Optional(typebox_1.Type.Any({})),
});
exports.GetStoreEntryRequest = typebox_1.Type.Object({
    key: typebox_1.Type.String({}),
});
exports.DeleteStoreEntryRequest = typebox_1.Type.Object({
    key: typebox_1.Type.String({}),
});
//# sourceMappingURL=store-entry-request.js.map