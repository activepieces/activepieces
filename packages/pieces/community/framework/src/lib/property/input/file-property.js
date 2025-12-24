"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProperty = exports.ApFile = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("./common");
const property_type_1 = require("./property-type");
class ApFile {
    constructor(filename, data, extension) {
        this.filename = filename;
        this.data = data;
        this.extension = extension;
    }
    get base64() {
        return this.data.toString('base64');
    }
}
exports.ApFile = ApFile;
exports.FileProperty = typebox_1.Type.Composite([
    common_1.BasePropertySchema,
    (0, common_1.TPropertyValue)(typebox_1.Type.Unknown(), property_type_1.PropertyType.FILE)
]);
//# sourceMappingURL=file-property.js.map