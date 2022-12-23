import {BaseModel} from "../model/base-model";
import {ProjectId} from "../model/project";
import {CollectionVersion} from "./collection-version";

export type CollectionId = string;

export interface Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

  version?: CollectionVersion;
}
