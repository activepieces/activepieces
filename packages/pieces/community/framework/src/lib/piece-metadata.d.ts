import { PiecePropertyMap } from "./property";
import { WebhookRenewConfiguration } from "./trigger/trigger";
import { ErrorHandlingOptionsParam } from "./action/action";
import { PieceAuthProperty } from "./property/authentication";
import { Static } from "@sinclair/typebox";
import { LocalesEnum, PackageType, PieceCategory, PieceType, ProjectId, TriggerStrategy, TriggerTestStrategy, WebhookHandshakeConfiguration } from "@activepieces/shared";
import { ContextVersion } from "./context/versioning";
declare const I18nForPiece: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
    nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>>;
export type I18nForPiece = Static<typeof I18nForPiece>;
export declare const PieceBase: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    name: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    logoUrl: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    authors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    directoryPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    auth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>]>>;
    version: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    minimumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    maximumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    i18n: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>>;
}>;
export type PieceBase = {
    id?: string;
    name: string;
    displayName: string;
    logoUrl: string;
    description: string;
    projectId?: ProjectId;
    platformId?: string;
    authors: string[];
    directoryPath?: string;
    auth?: PieceAuthProperty | PieceAuthProperty[];
    version: string;
    categories?: PieceCategory[];
    minimumSupportedRelease?: string;
    maximumSupportedRelease?: string;
    i18n?: Partial<Record<LocalesEnum, Record<string, string>>>;
    getContextInfo: (() => {
        version: ContextVersion;
    }) | undefined;
};
export declare const ActionBase: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>]>>;
    requireAuth: import("@sinclair/typebox").TBoolean;
    errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        retryOnFailure: import("@sinclair/typebox").TObject<{
            defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
        continueOnFailure: import("@sinclair/typebox").TObject<{
            defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
    }>>;
}>;
export type ActionBase = {
    name: string;
    displayName: string;
    description: string;
    props: PiecePropertyMap;
    requireAuth: boolean;
    errorHandlingOptions?: ErrorHandlingOptionsParam;
};
export declare const TriggerBase: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>]>>;
    errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        retryOnFailure: import("@sinclair/typebox").TObject<{
            defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
        continueOnFailure: import("@sinclair/typebox").TObject<{
            defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>;
    }>>;
    type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
    sampleData: import("@sinclair/typebox").TUnknown;
    testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
    handshakeConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        strategy: import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").WebhookHandshakeStrategy>;
        paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    renewConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.CRON>;
        cronExpression: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.NONE>;
    }>]>>;
}>;
export type TriggerBase = ActionBase & {
    type: TriggerStrategy;
    sampleData: unknown;
    handshakeConfiguration?: WebhookHandshakeConfiguration;
    renewConfiguration?: WebhookRenewConfiguration;
    testStrategy: TriggerTestStrategy;
};
export declare const PieceMetadata: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    version: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    auth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>]>>;
    logoUrl: import("@sinclair/typebox").TString;
    authors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    directoryPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    minimumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    maximumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    i18n: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>>;
    triggers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
        type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
        sampleData: import("@sinclair/typebox").TUnknown;
        testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
        handshakeConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").WebhookHandshakeStrategy>;
            paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        renewConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.CRON>;
            cronExpression: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.NONE>;
        }>]>>;
    }>>;
    actions: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        requireAuth: import("@sinclair/typebox").TBoolean;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
    }>>;
}>;
export type PieceMetadata = Omit<PieceBase, 'getContextInfo'> & {
    actions: Record<string, ActionBase>;
    triggers: Record<string, TriggerBase>;
    contextInfo: {
        version: ContextVersion;
    } | undefined;
};
export declare const PieceMetadataSummary: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    version: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    auth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>]>>;
    logoUrl: import("@sinclair/typebox").TString;
    authors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    directoryPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    minimumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    maximumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    i18n: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>>;
    triggers: import("@sinclair/typebox").TNumber;
    actions: import("@sinclair/typebox").TNumber;
    suggestedActions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
        type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
        sampleData: import("@sinclair/typebox").TUnknown;
        testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
        handshakeConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").WebhookHandshakeStrategy>;
            paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        renewConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.CRON>;
            cronExpression: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.NONE>;
        }>]>>;
    }>>>;
    suggestedTriggers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        requireAuth: import("@sinclair/typebox").TBoolean;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
    }>>>;
}>;
export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
    actions: number;
    triggers: number;
    suggestedActions?: ActionBase[];
    suggestedTriggers?: TriggerBase[];
};
declare const PiecePackageMetadata: import("@sinclair/typebox").TObject<{
    projectUsage: import("@sinclair/typebox").TNumber;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    pieceType: import("@sinclair/typebox").TEnum<typeof PieceType>;
    packageType: import("@sinclair/typebox").TEnum<typeof PackageType>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    archiveId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
type PiecePackageMetadata = Static<typeof PiecePackageMetadata>;
export declare const PieceMetadataModel: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    version: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    auth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>]>>;
    logoUrl: import("@sinclair/typebox").TString;
    authors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    directoryPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    minimumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    maximumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    i18n: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>>;
    triggers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
        type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
        sampleData: import("@sinclair/typebox").TUnknown;
        testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
        handshakeConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").WebhookHandshakeStrategy>;
            paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        renewConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.CRON>;
            cronExpression: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.NONE>;
        }>]>>;
    }>>;
    actions: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        requireAuth: import("@sinclair/typebox").TBoolean;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
    }>>;
    packageType: import("@sinclair/typebox").TEnum<typeof PackageType>;
    pieceType: import("@sinclair/typebox").TEnum<typeof PieceType>;
    archiveId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    projectUsage: import("@sinclair/typebox").TNumber;
}>;
export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata;
export declare const PieceMetadataModelSummary: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TString]>>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    version: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    auth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
        password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>]>>, import("@sinclair/typebox").TSchema]>;
        prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
        authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
        pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
        authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
        grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
        extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>]>>;
    logoUrl: import("@sinclair/typebox").TString;
    authors: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    directoryPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    minimumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    maximumSupportedRelease: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    i18n: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        nl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        en: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        de: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        fr: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        es: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ja: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        zh: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        pt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        ar: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        "zh-TW": import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    }>>;
    triggers: import("@sinclair/typebox").TNumber;
    actions: import("@sinclair/typebox").TNumber;
    suggestedActions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
        type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
        sampleData: import("@sinclair/typebox").TUnknown;
        testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
        handshakeConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").WebhookHandshakeStrategy>;
            paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        renewConfiguration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.CRON>;
            cronExpression: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            strategy: import("@sinclair/typebox").TLiteral<import("./trigger/trigger").WebhookRenewStrategy.NONE>;
        }>]>>;
    }>>>;
    suggestedTriggers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                    label: import("@sinclair/typebox").TString;
                    value: import("@sinclair/typebox").TUnknown;
                }>>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
            password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                displayName: import("@sinclair/typebox").TString;
                description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
            props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            }>, import("@sinclair/typebox").TObject<{
                [x: string]: import("@sinclair/typebox").TSchema;
                [x: number]: import("@sinclair/typebox").TSchema;
                displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
                options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
                    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                        label: import("@sinclair/typebox").TString;
                        value: import("@sinclair/typebox").TUnknown;
                    }>>;
                }>, import("@sinclair/typebox").TSchema]>;
            }>]>>, import("@sinclair/typebox").TSchema]>;
            prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, import("@sinclair/typebox").TSchema]>;
            authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TSchema]>;
            pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, import("@sinclair/typebox").TSchema]>;
            authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./property").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
            grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
            extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
        }>, import("@sinclair/typebox").TObject<{
            [x: string]: import("@sinclair/typebox").TSchema;
            [x: number]: import("@sinclair/typebox").TSchema;
            displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
            description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        }>]>]>>;
        requireAuth: import("@sinclair/typebox").TBoolean;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            retryOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
            continueOnFailure: import("@sinclair/typebox").TObject<{
                defaultValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                hide: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>;
        }>>;
    }>>>;
    packageType: import("@sinclair/typebox").TEnum<typeof PackageType>;
    pieceType: import("@sinclair/typebox").TEnum<typeof PieceType>;
    archiveId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    projectUsage: import("@sinclair/typebox").TNumber;
}>;
export type PieceMetadataModelSummary = PieceMetadataSummary & PiecePackageMetadata;
export declare const PiecePackageInformation: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    version: import("@sinclair/typebox").TString;
}>;
export type PiecePackageInformation = Static<typeof PiecePackageInformation>;
export {};
