import { Static, Type } from "@sinclair/typebox";
import { Cursor } from "../../common/seek-page";

export const ListAppRequest = Type.Object({
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String({}),
    limit: Type.Optional(Type.Number({}))
});
export type ListAppRequest = Static<typeof ListAppRequest> & {cursor: Cursor};
