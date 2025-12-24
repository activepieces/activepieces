import { BasicAuthProperty } from "./basic-auth-prop";
import { CustomAuthProperty, CustomAuthProps } from "./custom-auth-prop";
import { SecretTextProperty } from "./secret-text-property";
import { OAuth2Property, OAuth2Props } from "./oauth2-prop";
import { AppConnectionType } from "@activepieces/shared";
export declare const PieceAuthProperty: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
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
    authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./oauth2-prop").OAuth2AuthorizationMethod>, import("@sinclair/typebox").TSchema]>;
    grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, import("@sinclair/typebox").TSchema]>;
    extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>]>;
export type PieceAuthProperty = BasicAuthProperty | CustomAuthProperty<any> | OAuth2Property<any> | SecretTextProperty<boolean>;
type AuthProperties<T> = Omit<Properties<T>, 'displayName'> & {
    displayName?: string;
};
type Properties<T> = Omit<T, 'valueSchema' | 'type' | 'defaultValidators' | 'defaultProcessors'>;
export declare const DEFAULT_CONNECTION_DISPLAY_NAME = "Connection";
export declare const PieceAuth: {
    SecretText<R extends boolean>(request: Properties<SecretTextProperty<R>>): R extends true ? SecretTextProperty<true> : SecretTextProperty<false>;
    OAuth2<T extends OAuth2Props>(request: AuthProperties<OAuth2Property<T>>): OAuth2Property<T>;
    BasicAuth(request: AuthProperties<BasicAuthProperty>): BasicAuthProperty;
    CustomAuth<T extends CustomAuthProps>(request: AuthProperties<CustomAuthProperty<T>>): CustomAuthProperty<T>;
    None(): any;
};
export type ExtractPieceAuthPropertyTypeForMethods<T extends PieceAuthProperty | PieceAuthProperty[] | undefined> = T extends PieceAuthProperty[] ? T[number] : T extends undefined ? undefined : T;
export declare function getAuthPropertyForValue({ authValueType, pieceAuth }: GetAuthPropertyForValue): PieceAuthProperty;
type GetAuthPropertyForValue = {
    authValueType: AppConnectionType;
    pieceAuth: PieceAuthProperty | PieceAuthProperty[] | undefined;
};
export {};
