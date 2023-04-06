import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import {FlowVersion} from "./flow-version";
import { ProjectId } from "../project/project";

export type FlowId = ApId;

export interface Flow extends BaseModel<FlowId> {
    projectId: ProjectId;
    version: FlowVersion;
}
