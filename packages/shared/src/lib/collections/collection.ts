import {BaseModel, BaseModelSchema} from "../common/base-model";
import {ProjectId} from "../project/project";
import { Type } from "@sinclair/typebox";
export type CollectionId = string;

export interface Collection extends BaseModel<CollectionId> {
  displayName: string;
  projectId: ProjectId;
}

export const Collection = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  displayName: Type.String(),
})