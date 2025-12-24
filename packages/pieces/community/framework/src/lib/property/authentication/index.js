"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieceAuth = exports.DEFAULT_CONNECTION_DISPLAY_NAME = exports.PieceAuthProperty = void 0;
exports.getAuthPropertyForValue = getAuthPropertyForValue;
const typebox_1 = require("@sinclair/typebox");
const basic_auth_prop_1 = require("./basic-auth-prop");
const custom_auth_prop_1 = require("./custom-auth-prop");
const secret_text_property_1 = require("./secret-text-property");
const property_type_1 = require("../input/property-type");
const oauth2_prop_1 = require("./oauth2-prop");
const shared_1 = require("@activepieces/shared");
exports.PieceAuthProperty = typebox_1.Type.Union([
    basic_auth_prop_1.BasicAuthProperty,
    custom_auth_prop_1.CustomAuthProperty,
    oauth2_prop_1.OAuth2Property,
    secret_text_property_1.SecretTextProperty,
]);
exports.DEFAULT_CONNECTION_DISPLAY_NAME = 'Connection';
exports.PieceAuth = {
    SecretText(request) {
        return Object.assign(Object.assign({}, request), { valueSchema: undefined, type: property_type_1.PropertyType.SECRET_TEXT });
    },
    OAuth2(request) {
        return Object.assign(Object.assign({}, request), { valueSchema: undefined, type: property_type_1.PropertyType.OAUTH2, displayName: request.displayName || exports.DEFAULT_CONNECTION_DISPLAY_NAME });
    },
    BasicAuth(request) {
        return Object.assign(Object.assign({}, request), { valueSchema: undefined, type: property_type_1.PropertyType.BASIC_AUTH, displayName: request.displayName || exports.DEFAULT_CONNECTION_DISPLAY_NAME, required: true });
    },
    CustomAuth(request) {
        return Object.assign(Object.assign({}, request), { valueSchema: undefined, type: property_type_1.PropertyType.CUSTOM_AUTH, displayName: request.displayName || exports.DEFAULT_CONNECTION_DISPLAY_NAME });
    },
    None() {
        return undefined;
    },
};
function getAuthPropertyForValue({ authValueType, pieceAuth }) {
    if (!Array.isArray(pieceAuth) || (0, shared_1.isNil)(pieceAuth)) {
        return pieceAuth;
    }
    return pieceAuth.find(auth => authConnectionTypeToPropertyType[authValueType] === auth.type);
}
const authConnectionTypeToPropertyType = {
    [shared_1.AppConnectionType.OAUTH2]: property_type_1.PropertyType.OAUTH2,
    [shared_1.AppConnectionType.CLOUD_OAUTH2]: property_type_1.PropertyType.OAUTH2,
    [shared_1.AppConnectionType.PLATFORM_OAUTH2]: property_type_1.PropertyType.OAUTH2,
    [shared_1.AppConnectionType.BASIC_AUTH]: property_type_1.PropertyType.BASIC_AUTH,
    [shared_1.AppConnectionType.CUSTOM_AUTH]: property_type_1.PropertyType.CUSTOM_AUTH,
    [shared_1.AppConnectionType.SECRET_TEXT]: property_type_1.PropertyType.SECRET_TEXT,
    [shared_1.AppConnectionType.NO_AUTH]: undefined,
};
//# sourceMappingURL=index.js.map