import { Static, Type } from "@sinclair/typebox";
import { AppConnectionType } from "../app-connection";

const commonAuthProps = {
    name: Type.String({}),
    appName: Type.String({}),
    projectId: Type.String({}),
};

const OAuth2ConnectionValue = {
    expires_in: Type.Optional(Type.Number()),
    claimed_at: Type.Optional(Type.Number()),
    refresh_token: Type.Optional(Type.String()),
    token_type: Type.String({}),
    access_token: Type.String({}),
    scope: Type.Array(Type.String({})),
    data: Type.Object({}),
}

const UpsertCloudOAuth2Request = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        ...OAuth2ConnectionValue,
        type: Type.Literal(AppConnectionType.CLOUD_OAUTH2),
    })
});

const UpsertSecretTextRequest = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        type: Type.Literal(AppConnectionType.SECRET_TEXT),
        api_key: Type.String({})
    })
});

const UpsertOAuth2Request = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        client_id: Type.String({}),
        client_secret: Type.String({}),
        token_url: Type.String({}),
        redirect_url: Type.String({}),
        ...OAuth2ConnectionValue,
        type: Type.Literal(AppConnectionType.OAUTH2),
    })
});

export const UpsertConnectionRequest = Type.Union([UpsertCloudOAuth2Request, UpsertOAuth2Request, UpsertSecretTextRequest]);
export type UpsertConnectionRequest = Static<typeof UpsertConnectionRequest>;