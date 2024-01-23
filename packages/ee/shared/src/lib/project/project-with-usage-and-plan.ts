
import { Static, Type } from '@sinclair/typebox'
import { Project } from '@activepieces/shared';
import { ProjectPlan, ProjectUsage } from '../billing'

export const ProjectWithUsageAndPlanResponse = Type.Composite([Project, Type.Object({
    plan: Type.Omit(ProjectPlan, ['stripeCustomerId']),
    usage: ProjectUsage
})])

export type ProjectWithUsageAndPlanResponse = Static<typeof ProjectWithUsageAndPlanResponse>