import { ProjectId , BaseModel} from "@activepieces/shared";

export type ProjectPlanId = string;
export const freePlanPrice = 'Free'
export const customPlanPrice = "Custom Pricing"
export type PlanTasksPrice = number | typeof freePlanPrice | typeof customPlanPrice;
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
export enum PlanSupportType {
    COMMUNITY="COMMUNITY",
    EMAIL="EMAIL",
    DEDICATED="DEDICATED"
}
export interface FlowPricingSubPlan {
    pricePlanId: string;
    amount: number;
    price: PlanTasksPrice;
}

export interface FlowPricingPlan {
    name: string;
    description: string;
    minimumPollingInterval: number,
    teamMembers: number,
    tasks: FlowPricingSubPlan[];
    addons?: {
        users?:{
            pricePerUserPerMonth:`$${number}`,
        }
        tasks?: {
            pricePer1kTasks: number
        }
    }
    manageProjects?:boolean,
    privatePieces?:  string,
    customTemplates?:boolean,
    customColorsAndLogos?:boolean,
    supportType?:PlanSupportType,
    embedding?:boolean,
    SSO?:boolean,
    auditLog?:boolean,
    customReports?:boolean,
    userPermissions?:boolean,
}

export interface BotPricingPlan {
    name: string,
    description: string,
    bots: number,
    datasourcesSize: number
    pricePlanId: string;
    price: string
}

