"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserIdentity = exports.UserIdentityProvider = void 0;
const typebox_1 = require("@sinclair/typebox");
const common_1 = require("../common");
var UserIdentityProvider;
(function (UserIdentityProvider) {
    UserIdentityProvider["EMAIL"] = "EMAIL";
    UserIdentityProvider["GOOGLE"] = "GOOGLE";
    UserIdentityProvider["SAML"] = "SAML";
    UserIdentityProvider["JWT"] = "JWT";
})(UserIdentityProvider || (exports.UserIdentityProvider = UserIdentityProvider = {}));
exports.UserIdentity = typebox_1.Type.Object(Object.assign(Object.assign({}, common_1.BaseModelSchema), { firstName: typebox_1.Type.String(), lastName: typebox_1.Type.String(), email: typebox_1.Type.String(), password: typebox_1.Type.String(), trackEvents: typebox_1.Type.Boolean(), newsLetter: typebox_1.Type.Boolean(), verified: typebox_1.Type.Boolean(), tokenVersion: typebox_1.Type.Optional(typebox_1.Type.String()), provider: typebox_1.Type.Enum(UserIdentityProvider) }));
//# sourceMappingURL=user-identity.js.map