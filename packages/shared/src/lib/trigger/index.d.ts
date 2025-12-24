import { Static } from '@sinclair/typebox';
export declare enum TriggerStrategy {
    POLLING = "POLLING",
    WEBHOOK = "WEBHOOK",
    APP_WEBHOOK = "APP_WEBHOOK"
}
export declare enum WebhookHandshakeStrategy {
    NONE = "NONE",
    HEADER_PRESENT = "HEADER_PRESENT",
    QUERY_PRESENT = "QUERY_PRESENT",
    BODY_PARAM_PRESENT = "BODY_PARAM_PRESENT"
}
export declare enum TriggerSourceScheduleType {
    CRON_EXPRESSION = "CRON_EXPRESSION"
}
export declare const WebhookHandshakeConfiguration: import("@sinclair/typebox").TObject<{
    strategy: import("@sinclair/typebox").TEnum<typeof WebhookHandshakeStrategy>;
    paramName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type WebhookHandshakeConfiguration = Static<typeof WebhookHandshakeConfiguration>;
export declare const ScheduleOptions: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof TriggerSourceScheduleType>;
    cronExpression: import("@sinclair/typebox").TString;
    timezone: import("@sinclair/typebox").TString;
}>;
export type ScheduleOptions = Static<typeof ScheduleOptions>;
export declare const TriggerSource: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof TriggerStrategy>;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    triggerName: import("@sinclair/typebox").TString;
    schedule: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        type: TriggerSourceScheduleType.CRON_EXPRESSION;
        cronExpression: string;
        timezone: string;
    }>>;
    flowVersionId: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    deleted: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    simulate: import("@sinclair/typebox").TBoolean;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type TriggerSource = Static<typeof TriggerSource>;
