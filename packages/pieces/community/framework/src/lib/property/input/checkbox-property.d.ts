import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
export declare const CheckboxProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type CheckboxProperty<R extends boolean> = BasePropertySchema & TPropertyValue<boolean, PropertyType.CHECKBOX, R>;
