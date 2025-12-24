"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWithMetaInformationAndProject = exports.UserWithMetaInformation = exports.User = exports.PasswordType = exports.EmailType = exports.UserStatus = exports.PlatformRole = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
var PlatformRole;
(function (PlatformRole) {
    /**
     * Platform administrator with full control over platform settings,
     * users, and all projects
     */
    PlatformRole["ADMIN"] = "ADMIN";
    /**
     * Regular platform member with access only to projects they are
     * explicitly invited to
     */
    PlatformRole["MEMBER"] = "MEMBER";
    /**
     * Platform operator with automatic access to all projects except (others' private projects) in the
     * platform but no platform administration capabilities
     */
    PlatformRole["OPERATOR"] = "OPERATOR";
})(PlatformRole || (exports.PlatformRole = PlatformRole = {}));
var UserStatus;
(function (UserStatus) {
    /* user is active */
    UserStatus["ACTIVE"] = "ACTIVE";
    /* user account deactivated */
    UserStatus["INACTIVE"] = "INACTIVE";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
exports.EmailType = typebox_1.Type.String({
    format: 'email',
});
exports.PasswordType = typebox_1.Type.String({
    minLength: 8,
    maxLength: 64,
});
exports.User = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { platformRole: typebox_1.Type.Enum(PlatformRole), status: typebox_1.Type.Enum(UserStatus), identityId: typebox_1.Type.String(), externalId: (0, base_model_1.Nullable)(typebox_1.Type.String()), platformId: (0, base_model_1.Nullable)(typebox_1.Type.String()), lastActiveDate: (0, base_model_1.Nullable)(typebox_1.Type.String()) }));
exports.UserWithMetaInformation = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    email: typebox_1.Type.String(),
    firstName: typebox_1.Type.String(),
    status: typebox_1.Type.Enum(UserStatus),
    externalId: (0, base_model_1.Nullable)(typebox_1.Type.String()),
    platformId: (0, base_model_1.Nullable)(typebox_1.Type.String()),
    platformRole: typebox_1.Type.Enum(PlatformRole),
    lastName: typebox_1.Type.String(),
    created: typebox_1.Type.String(),
    updated: typebox_1.Type.String(),
    lastActiveDate: (0, base_model_1.Nullable)(typebox_1.Type.String()),
});
exports.UserWithMetaInformationAndProject = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    email: typebox_1.Type.String(),
    firstName: typebox_1.Type.String(),
    status: typebox_1.Type.Enum(UserStatus),
    externalId: (0, base_model_1.Nullable)(typebox_1.Type.String()),
    platformId: (0, base_model_1.Nullable)(typebox_1.Type.String()),
    platformRole: typebox_1.Type.Enum(PlatformRole),
    lastName: typebox_1.Type.String(),
    created: typebox_1.Type.String(),
    updated: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
    trackEvents: typebox_1.Type.Boolean(),
    newsLetter: typebox_1.Type.Boolean(),
    verified: typebox_1.Type.Boolean(),
    lastActiveDate: (0, base_model_1.Nullable)(typebox_1.Type.String()),
});
//# sourceMappingURL=user.js.map