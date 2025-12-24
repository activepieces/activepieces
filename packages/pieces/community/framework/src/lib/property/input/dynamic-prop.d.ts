import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from "./dropdown/static-dropdown";
import { ShortTextProperty } from "./text-property";
import { BasePropertySchema, TPropertyValue } from "./common";
import { AppConnectionValueForAuthProperty, PropertyContext } from "../../context";
import { PropertyType } from "./property-type";
import { JsonProperty } from "./json-property";
import { ArrayProperty } from "./array-property";
import { ExtractPieceAuthPropertyTypeForMethods, InputPropertyMap, PieceAuthProperty } from "..";
export declare const DynamicProp: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
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
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, import("@sinclair/typebox").TSchema]>;
}>]>;
export type DynamicProp = ShortTextProperty<boolean> | StaticDropdownProperty<any, boolean> | JsonProperty<boolean> | ArrayProperty<boolean> | StaticMultiSelectDropdownProperty<any, boolean>;
export declare const DynamicPropsValue: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
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
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, import("@sinclair/typebox").TSchema]>;
}>]>>;
export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>;
export declare const DynamicProperties: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type DynamicProperties<R extends boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = BasePropertySchema & {
    auth: PieceAuth;
    props: DynamicPropertiesOptions<PieceAuth>;
    refreshers: string[];
} & TPropertyValue<DynamicPropsValue, PropertyType.DYNAMIC, R>;
type DynamicPropertiesOptions<PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = (propsValue: Record<string, unknown> & {
    auth?: AppConnectionValueForAuthProperty<ExtractPieceAuthPropertyTypeForMethods<PieceAuth>>;
}, ctx: PropertyContext) => Promise<InputPropertyMap>;
export {};
