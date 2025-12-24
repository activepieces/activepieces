"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveValueFromProps = exports.AppConnectionOwners = exports.AppConnectionWithoutSensitiveData = exports.AppConnectionType = exports.AppConnectionScope = exports.AppConnectionStatus = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
const id_generator_1 = require("../common/id-generator");
const metadata_1 = require("../common/metadata");
const user_1 = require("../user");
var AppConnectionStatus;
(function (AppConnectionStatus) {
    AppConnectionStatus["ACTIVE"] = "ACTIVE";
    AppConnectionStatus["MISSING"] = "MISSING";
    AppConnectionStatus["ERROR"] = "ERROR";
})(AppConnectionStatus || (exports.AppConnectionStatus = AppConnectionStatus = {}));
var AppConnectionScope;
(function (AppConnectionScope) {
    AppConnectionScope["PROJECT"] = "PROJECT";
    AppConnectionScope["PLATFORM"] = "PLATFORM";
})(AppConnectionScope || (exports.AppConnectionScope = AppConnectionScope = {}));
var AppConnectionType;
(function (AppConnectionType) {
    AppConnectionType["OAUTH2"] = "OAUTH2";
    AppConnectionType["PLATFORM_OAUTH2"] = "PLATFORM_OAUTH2";
    AppConnectionType["CLOUD_OAUTH2"] = "CLOUD_OAUTH2";
    AppConnectionType["SECRET_TEXT"] = "SECRET_TEXT";
    AppConnectionType["BASIC_AUTH"] = "BASIC_AUTH";
    AppConnectionType["CUSTOM_AUTH"] = "CUSTOM_AUTH";
    AppConnectionType["NO_AUTH"] = "NO_AUTH";
})(AppConnectionType || (exports.AppConnectionType = AppConnectionType = {}));
exports.AppConnectionWithoutSensitiveData = typebox_1.Type.Object(Object.assign(Object.assign({}, base_model_1.BaseModelSchema), { externalId: typebox_1.Type.String(), displayName: typebox_1.Type.String(), type: typebox_1.Type.Enum(AppConnectionType), pieceName: typebox_1.Type.String(), projectIds: typebox_1.Type.Array(id_generator_1.ApId), platformId: (0, base_model_1.Nullable)(typebox_1.Type.String()), scope: typebox_1.Type.Enum(AppConnectionScope), status: typebox_1.Type.Enum(AppConnectionStatus), ownerId: (0, base_model_1.Nullable)(typebox_1.Type.String()), owner: (0, base_model_1.Nullable)(user_1.UserWithMetaInformation), metadata: (0, base_model_1.Nullable)(metadata_1.Metadata), flowIds: (0, base_model_1.Nullable)(typebox_1.Type.Array(id_generator_1.ApId)), pieceVersion: typebox_1.Type.String() }), {
    description: 'App connection is a connection to an external app.',
});
exports.AppConnectionOwners = typebox_1.Type.Object({
    firstName: typebox_1.Type.String(),
    lastName: typebox_1.Type.String(),
    email: typebox_1.Type.String(),
});
/**i.e props: {projectId: "123"} and value: "{{projectId}}" will return "123" */
const resolveValueFromProps = (props, value) => {
    let resolvedScope = value;
    if (!props) {
        return resolvedScope;
    }
    Object.entries(props).forEach(([key, value]) => {
        resolvedScope = resolvedScope.replace(`{${key}}`, String(value));
    });
    return resolvedScope;
};
exports.resolveValueFromProps = resolveValueFromProps;
//# sourceMappingURL=app-connection.js.map