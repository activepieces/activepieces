import {BaseModel} from "../model/base-model";
import {ProjectId} from "../model/project";

export type CollectionId = string;

export interface Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

}
