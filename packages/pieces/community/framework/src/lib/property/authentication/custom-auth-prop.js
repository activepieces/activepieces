"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAuthProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../input/common");
const property_type_1 = require("../input/property-type");
const text_property_1 = require("../input/text-property");
const number_property_1 = require("../input/number-property");
const checkbox_property_1 = require("../input/checkbox-property");
const static_dropdown_1 = require("../input/dropdown/static-dropdown");
const common_2 = require("./common");
const CustomAuthProps = typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Union([
    text_property_1.ShortTextProperty,
    text_property_1.LongTextProperty,
    number_property_1.NumberProperty,
    checkbox_property_1.CheckboxProperty,
    static_dropdown_1.StaticDropdownProperty,
]));
exports.CustomAuthProperty = typebox_1.Type.Composite([
    common_2.BasePieceAuthSchema,
    typebox_1.Type.Object({
        props: CustomAuthProps,
    }),
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.CUSTOM_AUTH)
]);
//# sourceMappingURL=custom-auth-prop.js.map