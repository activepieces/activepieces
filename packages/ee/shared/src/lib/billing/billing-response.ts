import { FlowPricingPlan, ProjectPlan } from "./plan"
import { ProjectUsage } from "./usage"

export type BillingResponse = {
    defaultPlan: { nickname: string; },
    usage: ProjectUsage,
    plan: ProjectPlan,
    plans: FlowPricingPlan[],
    customerPortalUrl : string
}