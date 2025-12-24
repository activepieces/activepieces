"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propsValidation = void 0;
const tslib_1 = require("tslib");
const zod_1 = require("zod");
exports.propsValidation = {
    validateZod(props, schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemaObj = zod_1.z.object(Object.entries(schema).reduce((acc, [key, value]) => (Object.assign(Object.assign({}, acc), { [key]: value })), {}));
            try {
                yield schemaObj.parseAsync(props);
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    const errors = error.issues.reduce((acc, err) => {
                        const path = err.path.join('.');
                        return Object.assign(Object.assign({}, acc), { [path]: err.message });
                    }, {});
                    throw new Error(JSON.stringify({ errors }, null, 2));
                }
                throw error;
            }
        });
    }
};
//# sourceMappingURL=index.js.map