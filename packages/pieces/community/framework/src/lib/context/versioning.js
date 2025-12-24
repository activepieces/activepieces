"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backwardCompatabilityContextUtils = exports.MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION = exports.LATEST_CONTEXT_VERSION = exports.ContextVersion = void 0;
var ContextVersion;
(function (ContextVersion) {
    ContextVersion["V1"] = "1";
})(ContextVersion || (exports.ContextVersion = ContextVersion = {}));
//bump these two constants after creating a new context version 
exports.LATEST_CONTEXT_VERSION = ContextVersion.V1;
exports.MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION = '0.73.0';
exports.backwardCompatabilityContextUtils = {
    makeActionContextBackwardCompatible({ context, contextVersion }) {
        switch (contextVersion) {
            case undefined:
                return migrateActionContextV1ToV0(context);
            case ContextVersion.V1:
                return context;
        }
    }
};
function migrateActionContextV1ToV0(context) {
    return Object.assign(Object.assign({}, context), { serverUrl: context.server.publicUrl });
}
//# sourceMappingURL=versioning.js.map