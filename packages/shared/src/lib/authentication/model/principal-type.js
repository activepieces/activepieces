"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointScope = exports.SERVICE_KEY_SECURITY_OPENAPI = exports.ALL_PRINCIPAL_TYPES = exports.PrincipalType = void 0;
var PrincipalType;
(function (PrincipalType) {
    PrincipalType["USER"] = "USER";
    PrincipalType["ENGINE"] = "ENGINE";
    PrincipalType["SERVICE"] = "SERVICE";
    PrincipalType["WORKER"] = "WORKER";
    PrincipalType["UNKNOWN"] = "UNKNOWN";
})(PrincipalType || (exports.PrincipalType = PrincipalType = {}));
exports.ALL_PRINCIPAL_TYPES = Object.values(PrincipalType);
exports.SERVICE_KEY_SECURITY_OPENAPI = {
    apiKey: [],
};
var EndpointScope;
(function (EndpointScope) {
    EndpointScope["PLATFORM"] = "PLATFORM";
    EndpointScope["PROJECT"] = "PROJECT";
})(EndpointScope || (exports.EndpointScope = EndpointScope = {}));
//# sourceMappingURL=principal-type.js.map