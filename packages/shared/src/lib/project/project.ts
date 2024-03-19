import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Static, Type } from '@sinclair/typebox'

export type ProjectId = ApId

export enum NotificationStatus {
    NEVER = 'NEVER',
    ALWAYS = 'ALWAYS',
}

export const ProjectUsage = Type.Object({
    tasks: Type.Number(),
    teamMembers: Type.Number(),
})

export type ProjectUsage = Static<typeof ProjectUsage>

export type ProjectPlanId = string

export const ProjectPlan = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    stripeCustomerId: Type.String(),
    stripeSubscriptionId: Nullable(Type.String()),
    subscriptionStartDatetime: Type.String(),
    flowPlanName: Type.String(),
    minimumPollingInterval: Type.Number(),
    connections: Type.Number(),
    teamMembers: Type.Number(),
    tasks: Type.Number(),
    tasksPerDay: Nullable(Type.Number()),
})

export type ProjectPlan = Static<typeof ProjectPlan>


export const Project = Type.Object({
    ...BaseModelSchema,
    deleted: Type.Union([Type.String(), Type.Null()]),
    ownerId: Type.String(),
    displayName: Type.String(),
    notifyStatus: Type.Enum(NotificationStatus),
    platformId: ApId,
    externalId: Type.Optional(Type.String()),
})

export type Project = Static<typeof Project>

export const ProjectWithLimits = Type.Composite([
    Project,
    Type.Object({
        usage: ProjectUsage,
        plan: ProjectPlan,
    }),

])

export type ProjectWithLimits = Static<typeof ProjectWithLimits>
