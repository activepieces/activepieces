import {BaseModel, BaseModelSchema} from "../common/base-model";
import {ProjectId} from "../project/project";
import { Static, Type } from "@sinclair/typebox";
export type CollectionId = string;
export interface Collection extends BaseModel<CollectionId> {
  displayName: string;
  projectId: ProjectId;
}
export enum CollectionStatus  {
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
    UNPUBLISHED= "UNPUBLISHED"
}
export const Collection = Type.Object({
  ...BaseModelSchema,
  projectId: Type.String(),
  displayName: Type.String(),
});

export const CollectionListDto = Type.Composite([
  Type.Object({
    status: Type.Enum(CollectionStatus),
  }),
  Collection
]);

export type CollectionListDto = Static<typeof CollectionListDto>;
