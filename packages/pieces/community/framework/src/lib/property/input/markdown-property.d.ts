import { BasePropertySchema, TPropertyValue } from './common';
import { PropertyType } from './property-type';
import { MarkdownVariant } from '@activepieces/shared';
export declare const MarkDownProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>;
export type MarkDownProperty = BasePropertySchema & TPropertyValue<undefined, PropertyType.MARKDOWN, false> & {
    variant?: MarkdownVariant;
};
