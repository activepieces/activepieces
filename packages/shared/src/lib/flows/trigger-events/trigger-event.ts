import { BaseModel } from "../../common/base-model";
import { ProjectId } from "../../project/project";
export type TriggerEventId = string;

export interface TriggerEvent extends BaseModel<TriggerEventId> {
  projectId: ProjectId;
  flowId: string;
  sourceName: string;
  payload: unknown;
}
