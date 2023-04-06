import { Static, Type } from "@sinclair/typebox";
import { Cursor } from "../../common/seek-page";

export const ListFlowsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListFlowsRequest = Omit<Static<typeof ListFlowsRequest>, "cursor"> & { cursor: Cursor | undefined };
