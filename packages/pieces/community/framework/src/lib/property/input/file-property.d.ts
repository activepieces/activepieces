import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
export declare class ApFile {
    filename: string;
    data: Buffer;
    extension?: string;
    constructor(filename: string, data: Buffer, extension?: string);
    get base64(): string;
}
export declare const FileProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type FileProperty<R extends boolean> = BasePropertySchema & TPropertyValue<ApFile, PropertyType.FILE, R>;
