import {BaseModel} from "./base-model";
import KSUID = require("ksuid");
import {CollectionId} from "../collection/collection";
import {CollectionVersionId} from "../collection/collection-version";
import {FlowVersionId} from "./flow-version";
import {ProjectId} from "./project";

export type InstanceId = KSUID;

export interface Instance extends BaseModel<InstanceId> {

  collectionId: CollectionId;
  collectionVersionId: CollectionVersionId;
  flowVersionId: Record<string, FlowVersionId>;
  projectId: ProjectId;
  status: InstanceStatus;

}

export enum InstanceStatus {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED"
}
