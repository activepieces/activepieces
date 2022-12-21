import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {UserId} from "./user";
import {ProjectId} from "./project";

export type CollectionId = KSUID;

export class Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

}
