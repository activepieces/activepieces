
import {  Static, Type } from '@sinclair/typebox'
import { Project } from '@activepieces/shared';
import { ProjectPlan, ProjectUsage } from '../billing'

export const ProjectWithUsageAndPlan =  Type.Composite([Project,Type.Object({
    plan:ProjectPlan,
    usage: ProjectUsage
})])

export type ProjectWithUsageAndPlan = Static<typeof ProjectWithUsageAndPlan>