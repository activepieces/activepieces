import {BaseModel, BaseModelSchema} from "../common/base-model";
import {ProjectId} from "../project/project";
import {CollectionVersion} from "./collection-version";
import { Type } from "@sinclair/typebox";
export type CollectionId = string;

export interface Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

  version: CollectionVersion | null;
}

export const Collection = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  version: Type.Optional(CollectionVersion),
})