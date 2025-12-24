"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretTextProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const common_2 = require("../input/common");
const property_type_1 = require("../input/property-type");
exports.SecretTextProperty = typebox_1.Type.Composite([
    common_1.BasePieceAuthSchema,
    (0, common_2.TPropertyValue)(typebox_1.Type.Object({
        auth: typebox_1.Type.String()
    }), property_type_1.PropertyType.SECRET_TEXT)
]);
//# sourceMappingURL=secret-text-property.js.map