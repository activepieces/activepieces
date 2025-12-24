"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFlowsFromAppConnectionRequestQuery = exports.ReplaceAppConnectionsRequestBody = exports.UpsertGlobalConnectionRequestBody = exports.UpdateGlobalConnectionValueRequestBody = exports.UpdateConnectionValueRequestBody = exports.UpsertAppConnectionRequestBody = exports.UpsertBasicAuthRequest = exports.UpsertOAuth2Request = exports.UpsertSecretTextRequest = exports.UpsertCloudOAuth2Request = exports.UpsertPlatformOAuth2Request = exports.UpsertNoAuthRequest = exports.UpsertCustomAuthRequest = exports.OAuth2GrantType = exports.BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE = void 0;
const typebox_1 = require("@sinclair/typebox");
const metadata_1 = require("../../common/metadata");
const app_connection_1 = require("../app-connection");
const oauth2_authorization_method_1 = require("../oauth2-authorization-method");
const commonAuthProps = {
    externalId: typebox_1.Type.String({}),
    displayName: typebox_1.Type.String({}),
    pieceName: typebox_1.Type.String({}),
    projectId: typebox_1.Type.String({}),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
    pieceVersion: typebox_1.Type.Optional(typebox_1.Type.String({})),
};
exports.BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE = 'both_client_credentials_and_authorization_code';
var OAuth2GrantType;
(function (OAuth2GrantType) {
    OAuth2GrantType["AUTHORIZATION_CODE"] = "authorization_code";
    OAuth2GrantType["CLIENT_CREDENTIALS"] = "client_credentials";
})(OAuth2GrantType || (exports.OAuth2GrantType = OAuth2GrantType = {}));
const propsSchema = typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown());
exports.UpsertCustomAuthRequest = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.CUSTOM_AUTH), value: typebox_1.Type.Object({
        type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.CUSTOM_AUTH),
        props: propsSchema,
    }) }), {
    title: 'Custom Auth',
    description: 'Custom Auth',
});
exports.UpsertNoAuthRequest = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.NO_AUTH), value: typebox_1.Type.Object({
        type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.NO_AUTH),
    }) }), {
    title: 'No Auth',
    description: 'No Auth',
});
const commonOAuth2ValueProps = {
    client_id: typebox_1.Type.String({
        minLength: 1,
    }),
    code: typebox_1.Type.String({
        minLength: 1,
    }),
    code_challenge: typebox_1.Type.Optional(typebox_1.Type.String({})),
    scope: typebox_1.Type.String(),
    authorization_method: typebox_1.Type.Optional(typebox_1.Type.Enum(oauth2_authorization_method_1.OAuth2AuthorizationMethod)),
};
exports.UpsertPlatformOAuth2Request = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.PLATFORM_OAUTH2), value: typebox_1.Type.Object(Object.assign(Object.assign({}, commonOAuth2ValueProps), { props: typebox_1.Type.Optional(propsSchema), type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.PLATFORM_OAUTH2), redirect_url: typebox_1.Type.String({
            minLength: 1,
        }) })) }), {
    title: 'Platform OAuth2',
    description: 'Platform OAuth2',
});
exports.UpsertCloudOAuth2Request = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.CLOUD_OAUTH2), value: typebox_1.Type.Object(Object.assign(Object.assign({}, commonOAuth2ValueProps), { props: typebox_1.Type.Optional(propsSchema), scope: typebox_1.Type.String(), type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.CLOUD_OAUTH2) })) }), {
    title: 'Cloud OAuth2',
    description: 'Cloud OAuth2',
});
exports.UpsertSecretTextRequest = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.SECRET_TEXT), value: typebox_1.Type.Object({
        type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.SECRET_TEXT),
        secret_text: typebox_1.Type.String({
            minLength: 1,
        }),
    }) }), {
    title: 'Secret Text',
    description: 'Secret Text',
});
exports.UpsertOAuth2Request = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.OAUTH2), value: typebox_1.Type.Object(Object.assign(Object.assign({}, commonOAuth2ValueProps), { client_secret: typebox_1.Type.String({
            minLength: 1,
        }), grant_type: typebox_1.Type.Optional(typebox_1.Type.Enum(OAuth2GrantType)), props: typebox_1.Type.Optional(typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Any())), authorization_method: typebox_1.Type.Optional(typebox_1.Type.Enum(oauth2_authorization_method_1.OAuth2AuthorizationMethod)), redirect_url: typebox_1.Type.String({
            minLength: 1,
        }), type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.OAUTH2) })) }), {
    title: 'OAuth2',
    description: 'OAuth2',
});
exports.UpsertBasicAuthRequest = typebox_1.Type.Object(Object.assign(Object.assign({}, commonAuthProps), { type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.BASIC_AUTH), value: typebox_1.Type.Object({
        username: typebox_1.Type.String({
            minLength: 1,
        }),
        password: typebox_1.Type.String({
            minLength: 1,
        }),
        type: typebox_1.Type.Literal(app_connection_1.AppConnectionType.BASIC_AUTH),
    }) }), {
    title: 'Basic Auth',
    description: 'Basic Auth',
});
exports.UpsertAppConnectionRequestBody = typebox_1.Type.Union([
    exports.UpsertSecretTextRequest,
    exports.UpsertOAuth2Request,
    exports.UpsertCloudOAuth2Request,
    exports.UpsertPlatformOAuth2Request,
    exports.UpsertBasicAuthRequest,
    exports.UpsertCustomAuthRequest,
    exports.UpsertNoAuthRequest,
]);
exports.UpdateConnectionValueRequestBody = typebox_1.Type.Object({
    displayName: typebox_1.Type.String({
        minLength: 1,
    }),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
});
exports.UpdateGlobalConnectionValueRequestBody = typebox_1.Type.Object({
    displayName: typebox_1.Type.String({
        minLength: 1,
    }),
    projectIds: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String())),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
});
const GlobalConnectionExtras = typebox_1.Type.Object({
    scope: typebox_1.Type.Literal(app_connection_1.AppConnectionScope.PLATFORM),
    projectIds: typebox_1.Type.Array(typebox_1.Type.String()),
    externalId: typebox_1.Type.Optional(typebox_1.Type.String()),
    metadata: typebox_1.Type.Optional(metadata_1.Metadata),
});
exports.UpsertGlobalConnectionRequestBody = typebox_1.Type.Union([
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertSecretTextRequest, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertOAuth2Request, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertCloudOAuth2Request, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertPlatformOAuth2Request, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertBasicAuthRequest, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertCustomAuthRequest, ['projectId', 'externalId']), GlobalConnectionExtras]),
    typebox_1.Type.Composite([typebox_1.Type.Omit(exports.UpsertNoAuthRequest, ['projectId', 'externalId']), GlobalConnectionExtras]),
]);
exports.ReplaceAppConnectionsRequestBody = typebox_1.Type.Object({
    sourceAppConnectionId: typebox_1.Type.String(),
    targetAppConnectionId: typebox_1.Type.String(),
    projectId: typebox_1.Type.String(),
});
exports.ListFlowsFromAppConnectionRequestQuery = typebox_1.Type.Object({
    sourceAppConnectionIds: typebox_1.Type.Array(typebox_1.Type.String()),
    projectId: typebox_1.Type.String(),
});
//# sourceMappingURL=upsert-app-connection-request.js.map