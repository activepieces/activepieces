import { Static } from '@sinclair/typebox';
export declare enum TableAutomationTrigger {
    ON_NEW_RECORD = "ON_NEW_RECORD",
    ON_UPDATE_RECORD = "ON_UPDATE_RECORD"
}
export declare enum TableAutomationStatus {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED"
}
export declare const Table: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
    trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Table = Static<typeof Table>;
export declare const PopulatedTable: import("@sinclair/typebox").TObject<{
    externalId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationStatus>>;
    trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<TableAutomationTrigger>>;
    fields: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        externalId: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<import("./field").FieldType.STATIC_DROPDOWN>;
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
        type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import("./field").FieldType.TEXT>, import("@sinclair/typebox").TLiteral<import("./field").FieldType.NUMBER>, import("@sinclair/typebox").TLiteral<import("./field").FieldType.DATE>]>;
        tableId: import("@sinclair/typebox").TString;
        projectId: import("@sinclair/typebox").TString;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>]>>;
}>;
export type PopulatedTable = Static<typeof PopulatedTable>;
