"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopulatedRecord = exports.Record = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
const cell_1 = require("./cell");
exports.Record = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { tableId: typebox_1.Type.String(), projectId: typebox_1.Type.String() }));
exports.PopulatedRecord = typebox_1.Type.Composite([
    exports.Record,
    typebox_1.Type.Object({
        cells: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Composite([
            typebox_1.Type.Pick(cell_1.Cell, ['updated', 'created', 'value']),
            typebox_1.Type.Object({
                fieldName: typebox_1.Type.String(),
            }),
        ])),
    }),
]);
//# sourceMappingURL=record.js.map