import { ProjectId , BaseModel} from "@activepieces/shared";

export type ProjectPlanId = string;

export interface ProjectPlan extends BaseModel<ProjectPlanId> {
    id: ProjectPlanId;
    projectId: ProjectId;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    subscriptionStartDatetime: string;
    name: string;
    tasks: number;
}
