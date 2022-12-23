import KSUID = require("ksuid");
import {BaseModel} from "../model/base-model";
import {UserId} from "../model/user";
import {ProjectId} from "../model/project";

export type CollectionId = KSUID;

export interface Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

}
