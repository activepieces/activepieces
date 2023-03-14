import {ProjectId} from "../../project/project";
import {Cursor} from "../../common/seek-page";
import { Static, Type } from "@sinclair/typebox";

export const ListCollectionsRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
});

export type ListCollectionsRequest = Static<typeof ListCollectionsRequest> & { projectId: ProjectId, cursor: Cursor};

