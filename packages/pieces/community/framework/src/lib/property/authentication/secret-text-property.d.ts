import { BasePieceAuthSchema } from "./common";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";
export declare const SecretTextProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type SecretTextProperty<R extends boolean> = BasePieceAuthSchema<string> & TPropertyValue<string, PropertyType.SECRET_TEXT, R>;
