"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeekPage = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("./base-model");
const SeekPage = (t) => typebox_1.Type.Object({
    data: typebox_1.Type.Array(t),
    next: (0, base_model_1.Nullable)(typebox_1.Type.String({ description: 'Cursor to the next page' })),
    previous: (0, base_model_1.Nullable)(typebox_1.Type.String({ description: 'Cursor to the previous page' })),
});
exports.SeekPage = SeekPage;
//# sourceMappingURL=seek-page.js.map