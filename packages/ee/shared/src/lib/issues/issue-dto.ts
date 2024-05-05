import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema } from "@activepieces/shared";

export enum IssueStatus {
    ONGOING = 'ONGOING',
    RESOLEVED = 'RESOLEVED',
}

export const Issue = Type.Object({
    ...BaseModelSchema,
    projectId: ApId,
    flowId: ApId,
    status: Type.Enum(IssueStatus),
    count: Type.Number(),
    lastOccurrence: Type.String(),
})

export type Issue = Static<typeof Issue>


export const PopulatedIssue = Type.Composite([Issue, Type.Object({
    flowDisplayName: Type.String()
})])

export type PopulatedIssue = Static<typeof PopulatedIssue>