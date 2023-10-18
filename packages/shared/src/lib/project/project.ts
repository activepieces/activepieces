import { BaseModelSchema } from "../common/base-model";
import { ApId } from "../common/id-generator";
import { NotificationStatus } from "./update-project-request";
import { Static, Type } from "@sinclair/typebox";

export type ProjectId = ApId;

export enum ProjectType {
  MANAGED = "MANAGED",
  UNMANAGED = "UNMANAGED",
}

export const Project = Type.Object({
  ...BaseModelSchema,
  ownerId: Type.String(),
  displayName: Type.String(),
  notifyStatus: Type.Enum(NotificationStatus),
  platformId: Type.Union([Type.String(), Type.Null()]),
  type: Type.Enum(ProjectType),
});

export type Project = Static<typeof Project>;