import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ApId } from '../common/id-generator'

export enum IssueStatus {
    RESOLVED = 'RESOLVED',
    UNRESOLVED = 'UNRESOLVED',
    ARCHIVED = 'ARCHIVED',
}

const Step = Type.Object({
    stepName: Type.String(),
    name: Type.String(),
})

export const Issue = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    flowId: ApId,
    flowVersionId: ApId,
    status: Type.Enum(IssueStatus),
    stepName: Type.Optional(Type.String()),
    lastOccurrence: Type.String(),
})

export type Issue = Static<typeof Issue>

export const PopulatedIssue = Type.Composite([Issue, Type.Object({
    count: Type.Number({ default: 0 }),
    step: Type.Optional(Step),
    flowDisplayName: Type.String(),
})])

export type PopulatedIssue = Static<typeof PopulatedIssue>
