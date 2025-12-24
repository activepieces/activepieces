import { Static } from '@sinclair/typebox';
import { BaseModel } from '../../../common';
export type TriggerEventId = string;
export declare const TriggerEvent: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    sourceName: import("@sinclair/typebox").TString;
    fileId: import("@sinclair/typebox").TString;
}>;
export type TriggerEvent = Static<typeof TriggerEvent> & BaseModel<TriggerEventId>;
export declare const TriggerEventWithPayload: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    sourceName: import("@sinclair/typebox").TString;
    fileId: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TUnknown;
}>;
export type TriggerEventWithPayload = Static<typeof TriggerEventWithPayload>;
