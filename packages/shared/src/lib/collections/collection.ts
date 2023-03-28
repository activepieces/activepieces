import {BaseModel, BaseModelSchema} from "../common/base-model";
import {ProjectId} from "../project/project";
import { Static, Type } from "@sinclair/typebox";
import { InstanceStatus } from "../instance";
export type CollectionId = string;
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
  status: Type.Enum(InstanceStatus),
  valid: Type.Boolean()
});
export type CollectionListDto = Static<typeof CollectionListDto>;
