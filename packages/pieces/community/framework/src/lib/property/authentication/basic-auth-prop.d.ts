import { Static } from '@sinclair/typebox';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { BasePieceAuthSchema } from './common';
export declare const BasicAuthPropertyValue: import("@sinclair/typebox").TObject<{
    username: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
}>;
export type BasicAuthPropertyValue = Static<typeof BasicAuthPropertyValue>;
export declare const BasicAuthProperty: import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    username: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, import("@sinclair/typebox").TSchema]>;
    password: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, import("@sinclair/typebox").TSchema]>;
}>;
export type BasicAuthProperty = BasePieceAuthSchema<BasicAuthPropertyValue> & {
    username: {
        displayName: string;
        description?: string;
    };
    password: {
        displayName: string;
        description?: string;
    };
} & TPropertyValue<BasicAuthPropertyValue, PropertyType.BASIC_AUTH, true>;
