import { ProjectId , BaseModel} from "@activepieces/shared";

export type ProjectPlanId = string;

export interface ProjectPlan extends BaseModel<ProjectPlanId> {
    id: ProjectPlanId;
    projectId: ProjectId;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    subscriptionStartDatetime: string;
    flowPlanName: string;
    botPlanName: string;
    minimumPollingInterval: number;
    connections: number;
    teamMembers: number;
    datasources: number;
    activeFlows: number;
    tasks: number;
    datasourcesSize: number,
    bots: number;
    tasksPerDay?: number | null;
}

export interface FlowPricingSubPlan {
    pricePlanId: string;
    amount: number;
    price: string;
}
export interface FlowPricingPlan {
    name: string;
    description: string;
    connections: number,
    minimumPollingInterval: number,
    teamMembers: number,
    tasks: FlowPricingSubPlan[];
}

export interface BotPricingPlan {
    name: string,
    description: string,
    bots: number,
    datasourcesSize: number
    pricePlanId: string;
    price: string
}