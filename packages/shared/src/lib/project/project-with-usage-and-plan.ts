import { Static, Type } from '@sinclair/typebox'
import { ProjectPlan, ProjectUsage } from '../billing'
import { Project } from "./project";

export const ProjectWithUsageAndPlanResponse = Type.Composite([Project, Type.Object({
    plan: Type.Omit(ProjectPlan, ['stripeCustomerId']),
    usage: ProjectUsage
})])

export type ProjectWithUsageAndPlanResponse = Static<typeof ProjectWithUsageAndPlanResponse>
