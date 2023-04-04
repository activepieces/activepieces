import { Static, Type } from "@sinclair/typebox";
import { AppConnectionType } from "../app-connection";

const commonAuthProps = {
    name: Type.String({}),
    appName: Type.String({}),
};

export const UpsertCustomAuthRequest = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        type: Type.Literal(AppConnectionType.CUSTOM_AUTH),
        props: Type.Record(Type.String(), Type.Unknown())
    })
});


export const UpsertCloudOAuth2Request = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        client_id: Type.String(),
        code: Type.String(),
        code_challenge: Type.Optional(Type.String()),
        props: Type.Optional(Type.Record(Type.String(), Type.String())),
        scope: Type.String(),
        type: Type.Literal(AppConnectionType.CLOUD_OAUTH2),
        token_url: Type.Optional(Type.String({})),
    })
});

export const UpsertSecretTextRequest = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        type: Type.Literal(AppConnectionType.SECRET_TEXT),
        secret_text: Type.String({})
    })
});

export const UpsertOAuth2Request = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        client_id: Type.String({}),
        client_secret: Type.String({}),
        token_url: Type.String({}),
        props: Type.Optional(Type.Record(Type.String(), Type.Any())),
        scope: Type.String(),
        code: Type.String(),
        code_challenge: Type.Optional(Type.String()),
        redirect_url: Type.String({}),
        type: Type.Literal(AppConnectionType.OAUTH2),
    })
});

export const UpsertBasicAuthRequest = Type.Object({
    ...commonAuthProps,
    value: Type.Object({
        username: Type.String({}),
        password: Type.String({}),
        type: Type.Literal(AppConnectionType.BASIC_AUTH),
    })
});

export type UpsertCloudOAuth2Request = Static<typeof UpsertCloudOAuth2Request>;
export type UpsertOAuth2Request = Static<typeof UpsertOAuth2Request>;
export type UpsertSecretTextRequest = Static<typeof UpsertSecretTextRequest>;
export type UpsertBasicAuthRequest = Static<typeof UpsertBasicAuthRequest>;
export type UpsertCustomAuthRequest = Static<typeof UpsertCustomAuthRequest>;
export type UpsertConnectionRequest = Static<typeof UpsertConnectionRequest>;
export const UpsertConnectionRequest = Type.Union([UpsertSecretTextRequest, UpsertOAuth2Request, UpsertCloudOAuth2Request, UpsertBasicAuthRequest, UpsertCustomAuthRequest]);
