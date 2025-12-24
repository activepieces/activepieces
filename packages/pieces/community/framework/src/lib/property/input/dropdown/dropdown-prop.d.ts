import { BasePropertySchema, TPropertyValue } from "../common";
import { DropdownState } from "./common";
import { AppConnectionValueForAuthProperty, PropertyContext } from "../../../context";
import { PropertyType } from "../property-type";
import { PieceAuthProperty } from "../../authentication";
type DynamicDropdownOptions<T, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = (propsValue: Record<string, unknown> & {
    auth?: PieceAuth extends undefined ? undefined : AppConnectionValueForAuthProperty<Exclude<PieceAuth, undefined>>;
}, ctx: PropertyContext) => Promise<DropdownState<T>>;
export declare const DropdownProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type DropdownProperty<T, R extends boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = BasePropertySchema & {
    /**
     * A dummy property used to infer {@code PieceAuth} type
     */
    auth: PieceAuth;
    refreshers: string[];
    refreshOnSearch?: boolean;
    options: DynamicDropdownOptions<T, PieceAuth>;
} & TPropertyValue<T, PropertyType.DROPDOWN, R>;
export declare const MultiSelectDropdownProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type MultiSelectDropdownProperty<T, R extends boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined> = BasePropertySchema & {
    /**
     * A dummy property used to infer {@code PieceAuth} type
     */
    auth: PieceAuth;
    refreshers: string[];
    refreshOnSearch?: boolean;
    options: DynamicDropdownOptions<T, PieceAuth>;
} & TPropertyValue<T[], PropertyType.MULTI_SELECT_DROPDOWN, R>;
export {};
