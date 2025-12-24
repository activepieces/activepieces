import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { LongTextProperty, ShortTextProperty } from '../input/text-property';
import { NumberProperty } from '../input/number-property';
import { CheckboxProperty } from '../input/checkbox-property';
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from '../input/dropdown/static-dropdown';
import { StaticPropsValue } from '..';
import { SecretTextProperty } from './secret-text-property';
import { BasePieceAuthSchema } from './common';
import { MarkDownProperty } from '../input/markdown-property';
export type CustomAuthProps = Record<string, ShortTextProperty<boolean> | LongTextProperty<boolean> | SecretTextProperty<boolean> | NumberProperty<boolean> | StaticDropdownProperty<unknown, boolean> | CheckboxProperty<boolean> | MarkDownProperty | StaticMultiSelectDropdownProperty<unknown, boolean>>;
export declare const CustomAuthProperty: import("@sinclair/typebox").TObject<{
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
}>;
export type CustomAuthProperty<T extends CustomAuthProps> = BasePieceAuthSchema<StaticPropsValue<T>> & {
    props: T;
} & TPropertyValue<StaticPropsValue<T>, PropertyType.CUSTOM_AUTH, true>;
