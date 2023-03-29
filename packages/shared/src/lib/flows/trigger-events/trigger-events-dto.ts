import { Static, Type } from "@sinclair/typebox";
import { Cursor } from "../../common/seek-page";
import { FlowId } from "../flow";

export const ListTriggerEventsRequest = Type.Object({
    flowId: Type.String({}),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListTriggerEventsRequest = Omit<Omit<Static<typeof ListTriggerEventsRequest>, "flowId">, "cursor"> & { flowId: FlowId, cursor: Cursor | undefined };

export const TestTriggerRequest = Type.Object({
    flowId: Type.String({}),
});

export type TestTriggerRequest = Omit<Static<typeof ListTriggerEventsRequest>, "flowId"> & { flowId: FlowId };

