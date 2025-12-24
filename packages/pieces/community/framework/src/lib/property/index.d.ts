import { InputProperty } from './input';
import { PieceAuthProperty } from './authentication';
import { TSchema } from '@sinclair/typebox';
import { PropertyType } from './input/property-type';
import { DropdownState } from './input/dropdown/common';
export { ApFile } from './input/file-property';
export { DropdownProperty, MultiSelectDropdownProperty } from './input/dropdown/dropdown-prop';
export { DynamicProperties, DynamicProp } from './input/dynamic-prop';
export { PropertyType } from './input/property-type';
export { Property } from './input';
export { PieceAuth, getAuthPropertyForValue } from './authentication';
export type { ExtractPieceAuthPropertyTypeForMethods } from './authentication';
export { DynamicPropsValue } from './input/dynamic-prop';
export { DropdownOption, DropdownState } from './input/dropdown/common';
export { OAuth2PropertyValue } from './authentication/oauth2-prop';
export { PieceAuthProperty, DEFAULT_CONNECTION_DISPLAY_NAME } from './authentication';
export { ShortTextProperty } from './input/text-property';
export { ArrayProperty, ArraySubProps } from './input/array-property';
export { BasePropertySchema } from './input/common';
export { CheckboxProperty } from './input/checkbox-property';
export { DateTimeProperty } from './input/date-time-property';
export { LongTextProperty } from './input/text-property';
export { NumberProperty } from './input/number-property';
export { ObjectProperty } from './input/object-property';
export { OAuth2Props } from './authentication/oauth2-prop';
export { OAuth2AuthorizationMethod } from './authentication/oauth2-prop';
export { BasicAuthPropertyValue } from './authentication/basic-auth-prop';
export { StaticMultiSelectDropdownProperty } from './input/dropdown/static-dropdown';
export { StaticDropdownProperty } from './input/dropdown/static-dropdown';
export * from './authentication/custom-auth-prop';
export { OAuth2Property } from './authentication/oauth2-prop';
export { FileProperty } from './input/file-property';
export { BasicAuthProperty } from './authentication/basic-auth-prop';
export { SecretTextProperty } from './authentication/secret-text-property';
export { CustomAuthProperty } from './authentication/custom-auth-prop';
export { JsonProperty } from './input/json-property';
export declare const PieceProperty: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, TSchema]>;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>]>>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, TSchema]>;
    password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>]>>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, TSchema]>;
    props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>]>>, TSchema]>;
    prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, TSchema]>;
    authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, TSchema]>;
    pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, TSchema]>;
    authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./authentication/oauth2-prop").OAuth2AuthorizationMethod>, TSchema]>;
    grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, TSchema]>;
    extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>]>]>;
export type PieceProperty = InputProperty | PieceAuthProperty;
export { CustomProperty } from './input/custom-property';
export type { CustomPropertyCodeFunctionParams } from './input/custom-property';
export declare const PiecePropertyMap: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, TSchema]>;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>]>>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>]>, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, TSchema]>;
    password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>]>>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    scope: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, TSchema]>;
    props: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>]>>, TSchema]>;
    prompt: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"none">, import("@sinclair/typebox").TLiteral<"consent">, import("@sinclair/typebox").TLiteral<"login">, import("@sinclair/typebox").TLiteral<"omit">]>, TSchema]>;
    authUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    tokenUrl: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    pkce: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TBoolean, TSchema]>;
    pkceMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"S256">]>, TSchema]>;
    authorizationMethod: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TEnum<typeof import("./authentication/oauth2-prop").OAuth2AuthorizationMethod>, TSchema]>;
    grantType: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TEnum<typeof import("@activepieces/shared").OAuth2GrantType>, import("@sinclair/typebox").TLiteral<"both_client_credentials_and_authorization_code">]>, TSchema]>;
    extra: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>]>]>>;
export interface PiecePropertyMap {
    [name: string]: PieceProperty;
}
export type { InputProperty } from './input';
export declare const InputPropertyMap: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, TSchema]>;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: TSchema;
        [x: number]: TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    }>]>>, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: TSchema;
    [x: number]: TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, TSchema]>;
}>]>>;
export interface InputPropertyMap {
    [name: string]: InputProperty;
}
export { piecePropertiesUtils } from './util';
export type PiecePropValueSchema<T extends PieceProperty> = T extends undefined ? undefined : T extends {
    required: true;
} ? T['valueSchema'] : T['valueSchema'] | undefined;
export type StaticPropsValue<T extends PiecePropertyMap> = {
    [P in keyof T]: PiecePropValueSchema<T[P]>;
};
export type ExecutePropsResult<T extends PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC> = {
    type: T;
    options: T extends PropertyType.DROPDOWN ? DropdownState<unknown> : T extends PropertyType.MULTI_SELECT_DROPDOWN ? DropdownState<unknown> : InputPropertyMap;
};
