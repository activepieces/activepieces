import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { Static, Type } from '@sinclair/typebox'

export type ProjectId = ApId

export enum NotificationStatus {
    NEVER = 'NEVER',
    ALWAYS = 'ALWAYS',
}

export enum ProjectType {
    PLATFORM_MANAGED = 'PLATFORM_MANAGED',
    STANDALONE = 'STANDALONE',
}

export const Project = Type.Object({
    ...BaseModelSchema,
    ownerId: Type.String(),
    displayName: Type.String(),
    notifyStatus: Type.Enum(NotificationStatus),
    type: Type.Enum(ProjectType),
    platformId: Type.Optional(ApId),
    externalId: Type.Optional(Type.String()),
})

export type Project = Static<typeof Project>
