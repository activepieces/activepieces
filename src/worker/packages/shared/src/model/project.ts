import {BaseModel} from "./base-model";
import {UserId} from "./user";
import {ApId} from "../helper/id-generator";

export type ProjectId = ApId;

export interface Project extends BaseModel<ProjectId> {

  ownerId: UserId;
  displayName: string;

}
