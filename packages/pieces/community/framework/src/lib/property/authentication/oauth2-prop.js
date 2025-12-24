"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth2Property = exports.OAuth2PropertyValue = exports.OAuth2Props = exports.OAuth2AuthorizationMethod = void 0;
const shared_1 = require("@activepieces/shared");
const typebox_1 = require("@sinclair/typebox");
const text_property_1 = require("../input/text-property");
const secret_text_property_1 = require("./secret-text-property");
const common_1 = require("./common");
const common_2 = require("../input/common");
const property_type_1 = require("../input/property-type");
const static_dropdown_1 = require("../input/dropdown/static-dropdown");
var OAuth2AuthorizationMethod;
(function (OAuth2AuthorizationMethod) {
    OAuth2AuthorizationMethod["HEADER"] = "HEADER";
    OAuth2AuthorizationMethod["BODY"] = "BODY";
})(OAuth2AuthorizationMethod || (exports.OAuth2AuthorizationMethod = OAuth2AuthorizationMethod = {}));
const OAuthProp = typebox_1.Type.Union([
    text_property_1.ShortTextProperty,
    secret_text_property_1.SecretTextProperty,
    static_dropdown_1.StaticDropdownProperty,
]);
exports.OAuth2Props = typebox_1.Type.Record(typebox_1.Type.String(), OAuthProp);
const OAuth2ExtraProps = typebox_1.Type.Object({
    props: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), OAuthProp)),
    authUrl: typebox_1.Type.String(),
    tokenUrl: typebox_1.Type.String(),
    scope: typebox_1.Type.Array(typebox_1.Type.String()),
    prompt: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal('none'), typebox_1.Type.Literal('consent'), typebox_1.Type.Literal('login'), typebox_1.Type.Literal('omit')])),
    pkce: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    pkceMethod: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Literal('plain'), typebox_1.Type.Literal('S256')])),
    authorizationMethod: typebox_1.Type.Optional(typebox_1.Type.Enum(OAuth2AuthorizationMethod)),
    grantType: typebox_1.Type.Optional(typebox_1.Type.Union([typebox_1.Type.Enum(shared_1.OAuth2GrantType), typebox_1.Type.Literal(shared_1.BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE)])),
    extra: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.String())),
});
exports.OAuth2PropertyValue = typebox_1.Type.Object({
    access_token: typebox_1.Type.String(),
    props: typebox_1.Type.Optional(exports.OAuth2Props),
    data: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Any())
});
exports.OAuth2Property = typebox_1.Type.Composite([
    common_1.BasePieceAuthSchema,
    OAuth2ExtraProps,
    (0, common_2.TPropertyValue)(exports.OAuth2PropertyValue, property_type_1.PropertyType.OAUTH2)
]);
//# sourceMappingURL=oauth2-prop.js.map