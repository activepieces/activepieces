import { ProjectId } from "@activepieces/shared";
import { BaseModel } from "@shared/common/base-model";

export type ProjectUsageId = string;

export interface ProjectUsage extends BaseModel<ProjectUsageId> {
    id: ProjectUsageId;
    projectId: ProjectId;
    consumedTasks: number;
    nextResetDatetime: string;
}
