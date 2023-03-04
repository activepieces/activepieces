import { ProjectPlan } from "./plan"
import { ProjectUsage } from "./usage"

export type BillingResponse = {
    usage: ProjectUsage,
    plan: ProjectPlan,
    customerPortalUrl : string
}