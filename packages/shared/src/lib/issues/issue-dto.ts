import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'

export enum IssueStatus {
    RESOLVED = 'RESOLVED',
    UNRESOLVED = 'UNRESOLVED',
    ARCHIVED = 'ARCHIVED',
}

const Step = Type.Object({
    stepId: Type.String(),
    name: Type.String(),
})

export const Issue = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    flowId: ApId,
    status: Type.Enum(IssueStatus),
    stepId: Type.Optional(Type.String()),
    step: Type.Optional(Step),
    count: Type.Number({ default: 0 }),
    lastOccurrence: Type.String(),
})

export type Issue = Static<typeof Issue>

export const PopulatedIssue = Type.Composite([Issue, Type.Object({
    flowDisplayName: Type.String(),
})])

export type PopulatedIssue = Static<typeof PopulatedIssue>
