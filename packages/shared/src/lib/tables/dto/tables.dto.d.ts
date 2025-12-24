import { Static } from '@sinclair/typebox';
import { TableAutomationStatus, TableAutomationTrigger } from '../table';
import { TableWebhookEventType } from '../table-webhook';
export declare const CreateTableRequest: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type CreateTableRequest = Static<typeof CreateTableRequest>;
export declare const ExportTableResponse: import("@sinclair/typebox").TObject<{
    fields: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        name: import("@sinclair/typebox").TString;
    }>>;
    rows: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    name: import("@sinclair/typebox").TString;
}>;
export type ExportTableResponse = Static<typeof ExportTableResponse>;
export declare const CreateTableWebhookRequest: import("@sinclair/typebox").TObject<{
    events: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TableWebhookEventType>>;
    webhookUrl: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
}>;
export type CreateTableWebhookRequest = Static<typeof CreateTableWebhookRequest>;
export declare const UpdateTableRequest: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    trigger: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TableAutomationTrigger>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TableAutomationStatus>>;
}>;
export type UpdateTableRequest = Static<typeof UpdateTableRequest>;
export declare const ListTablesRequest: import("@sinclair/typebox").TObject<{
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    externalIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type ListTablesRequest = Static<typeof ListTablesRequest>;
