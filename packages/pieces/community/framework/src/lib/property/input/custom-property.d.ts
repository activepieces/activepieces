import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
export declare const CustomProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type CustomProperty<R extends boolean> = BasePropertySchema & TPropertyValue<unknown, PropertyType.CUSTOM, R> & {
    code: string;
};
export type CustomPropertyCodeFunctionParams = {
    containerId: string;
    value: unknown;
    onChange: (value: unknown) => void;
    isEmbeded: boolean;
    projectId: string;
    property: Pick<CustomProperty<boolean>, 'displayName' | 'description' | 'required'>;
    disabled: boolean;
};
