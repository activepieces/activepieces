import { Static } from '@sinclair/typebox';
export declare enum FieldType {
    TEXT = "TEXT",
    NUMBER = "NUMBER",
    DATE = "DATE",
    STATIC_DROPDOWN = "STATIC_DROPDOWN"
}
export declare const Field: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<FieldType.STATIC_DROPDOWN>;
    tableId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    data: import("@sinclair/typebox").TObject<{
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TString;
        }>>;
    }>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<FieldType.TEXT>, import("@sinclair/typebox").TLiteral<FieldType.NUMBER>, import("@sinclair/typebox").TLiteral<FieldType.DATE>]>;
    tableId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>]>;
export type Field = Static<typeof Field>;
export declare const StaticDropdownEmptyOption: {
    label: string;
    value: string;
};
