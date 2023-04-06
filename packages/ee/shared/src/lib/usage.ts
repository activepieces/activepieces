import { ProjectId, BaseModel} from "@activepieces/shared";

export type ProjectUsageId = string;

export interface ProjectUsage extends BaseModel<ProjectUsageId> {
    id: ProjectUsageId;
    projectId: ProjectId;
    consumedTasks: number;
    nextResetDatetime: string;
}
