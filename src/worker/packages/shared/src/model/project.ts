import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {UserId} from "./user";

export type ProjectId = KSUID;

export interface Project extends BaseModel<ProjectId> {

  ownerId: UserId;
  displayName: string;

}
