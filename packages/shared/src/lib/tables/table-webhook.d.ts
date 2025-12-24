import { Static } from '@sinclair/typebox';
export declare enum TableWebhookEventType {
    RECORD_CREATED = "RECORD_CREATED",
    RECORD_UPDATED = "RECORD_UPDATED",
    RECORD_DELETED = "RECORD_DELETED"
}
export declare const TableWebhook: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    tableId: import("@sinclair/typebox").TString;
    events: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TableWebhookEventType>>;
    flowId: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type TableWebhook = Static<typeof TableWebhook>;
