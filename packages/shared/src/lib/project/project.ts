import {BaseModel} from "../common/base-model";
import {UserId} from "../user/user";
import {ApId} from "../common/id-generator";
import { NotificationStatus } from "./update-project-request";

export type ProjectId = ApId;


export interface Project extends BaseModel<ProjectId> {

  ownerId: UserId;
  displayName: string;
  notifications: NotificationStatus;

}
