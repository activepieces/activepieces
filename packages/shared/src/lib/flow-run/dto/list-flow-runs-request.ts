import {Cursor} from "../../common/seek-page";
import { Static, Type } from "@sinclair/typebox";

export const ListFlowRunsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListFlowRunsRequest = Static<typeof ListFlowRunsRequest> & {cursor: Cursor};

