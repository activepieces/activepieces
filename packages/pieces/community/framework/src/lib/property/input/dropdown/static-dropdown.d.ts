import { BasePropertySchema, TPropertyValue } from "../common";
import { DropdownState } from "./common";
import { PropertyType } from "../property-type";
export declare const StaticDropdownProperty: import("@sinclair/typebox").TObject<{
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
}>;
export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
    options: DropdownState<T>;
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>;
export declare const StaticMultiSelectDropdownProperty: import("@sinclair/typebox").TObject<{
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
}>;
export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
    options: DropdownState<T>;
} & TPropertyValue<T[], PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>;
