import { Static, Type } from "@sinclair/typebox";
import { Cursor } from "../../common/seek-page";
import { FlowId } from "../flow";

export const ListenForTriggerEventsRequest = Type.Object({
    flowId: Type.String(),
});

export type ListenForTriggerEventsRequest = Static<typeof ListenForTriggerEventsRequest>;

export const ListTriggerEventsRequest = Type.Object({
    flowId: Type.String({}),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListTriggerEventsRequest = Omit<Omit<Static<typeof ListTriggerEventsRequest>, "flowId">, "cursor"> & { flowId: FlowId, cursor: Cursor | undefined };
