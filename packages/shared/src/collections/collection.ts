import {BaseModel} from "../common/base-model";
import {ProjectId} from "../project/project";
import {CollectionVersion} from "./collection-version";

export type CollectionId = string;

export interface Collection extends BaseModel<CollectionId> {

  projectId: ProjectId;

  version: CollectionVersion | null;
}
