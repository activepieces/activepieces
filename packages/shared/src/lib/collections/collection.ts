import {BaseModel, BaseModelSchema} from "../common/base-model";
import {ProjectId} from "../project/project";
import { Static, Type } from "@sinclair/typebox";
export type CollectionId = string;
export enum CollectionStatus {
  ENABLED="ENABLED",
  DISABLED="DISABLED",
  UNPUBLISHED="UNPUBLISHED"
}
export interface Collection extends BaseModel<CollectionId> {
  displayName: string;
  projectId: ProjectId;
}

export const Collection = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  displayName: Type.String(),
});

export const CollectionListDto = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  displayName: Type.String(),
  status: Type.Enum(CollectionStatus)
});
export type CollectionListDto = Static<typeof CollectionListDto>;
