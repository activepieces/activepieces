import { Static } from '@sinclair/typebox';
import { Cursor } from '../../common/seek-page';
export declare const CreateRecordsRequest: import("@sinclair/typebox").TObject<{
    records: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        fieldId: import("@sinclair/typebox").TString;
        value: import("@sinclair/typebox").TString;
    }>>>;
    tableId: import("@sinclair/typebox").TString;
}>;
export type CreateRecordsRequest = Static<typeof CreateRecordsRequest>;
export declare const UpdateRecordRequest: import("@sinclair/typebox").TObject<{
    cells: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        fieldId: import("@sinclair/typebox").TString;
        value: import("@sinclair/typebox").TString;
    }>>>;
    tableId: import("@sinclair/typebox").TString;
    agentUpdate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export type UpdateRecordRequest = Static<typeof UpdateRecordRequest>;
export declare enum FilterOperator {
    EQ = "eq",
    NEQ = "neq",
    GT = "gt",
    GTE = "gte",
    LT = "lt",
    LTE = "lte",
    CO = "co"
}
export declare const Filter: import("@sinclair/typebox").TObject<{
    fieldId: import("@sinclair/typebox").TString;
    value: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FilterOperator>>;
}>;
export type Filter = Static<typeof Filter>;
export declare const ListRecordsRequest: import("@sinclair/typebox").TObject<{
    tableId: import("@sinclair/typebox").TString;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    filters: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        fieldId: import("@sinclair/typebox").TString;
        value: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FilterOperator>>;
    }>>>;
}>;
export type ListRecordsRequest = Omit<Static<typeof ListRecordsRequest>, 'cursor'> & {
    cursor: Cursor | undefined;
};
export declare const DeleteRecordsRequest: import("@sinclair/typebox").TObject<{
    ids: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export type DeleteRecordsRequest = Static<typeof DeleteRecordsRequest>;
