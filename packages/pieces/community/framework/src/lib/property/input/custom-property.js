"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomProperty = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
// Code should be a valid javascript function that takes a single argument which is an object 
/*
(ctx: {containerId:string, value: unknown, onChange: (value: unknown) => void, isEmbeded: boolean, projectId:string}) => void
*/
exports.CustomProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.CUSTOM),
    typebox_1.Type.Object({
        code: typebox_1.Type.String(),
    })
]);
//# sourceMappingURL=custom-property.js.map