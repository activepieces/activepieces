import {BaseModel} from "../common/base-model";
import {CollectionId} from "../collections/collection";
import {CollectionVersionId} from "../collections/collection-version";
import {FlowVersionId} from "../flows/flow-version";
import {ProjectId} from "../project/project";
import {ApId} from "../common/id-generator";

export type InstanceId = ApId;

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
