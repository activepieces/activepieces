"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicAuthProperty = exports.BasicAuthPropertyValue = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../input/common");
const property_type_1 = require("../input/property-type");
const common_2 = require("./common");
exports.BasicAuthPropertyValue = typebox_1.Type.Object({
    username: typebox_1.Type.String(),
    password: typebox_1.Type.String(),
});
exports.BasicAuthProperty = typebox_1.Type.Composite([
    common_2.BasePieceAuthSchema,
    typebox_1.Type.Object({
        username: typebox_1.Type.Object({
            displayName: typebox_1.Type.String(),
            description: typebox_1.Type.Optional(typebox_1.Type.String())
        }),
        password: typebox_1.Type.Object({
            displayName: typebox_1.Type.String(),
            description: typebox_1.Type.Optional(typebox_1.Type.String())
        })
    }),
    (0, common_1.TPropertyValue)(exports.BasicAuthPropertyValue, property_type_1.PropertyType.BASIC_AUTH)
]);
//# sourceMappingURL=basic-auth-prop.js.map