import { Static, Type } from "@sinclair/typebox";
import {ProjectId} from "../../project/project";

export const CreateCollectionRequest = Type.Object({
    projectId: Type.String({}),
    displayName: Type.String({}),
});

export type CreateCollectionRequest = Static<typeof CreateCollectionRequest> & { projectId: ProjectId};

