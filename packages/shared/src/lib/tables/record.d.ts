import { Static } from '@sinclair/typebox';
export declare const Record: import("@sinclair/typebox").TObject<{
    tableId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Record = Static<typeof Record>;
export declare const PopulatedRecord: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    tableId: import("@sinclair/typebox").TString;
    cells: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TUnknown;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
        fieldName: import("@sinclair/typebox").TString;
    }>>;
}>;
export type PopulatedRecord = Static<typeof PopulatedRecord>;
