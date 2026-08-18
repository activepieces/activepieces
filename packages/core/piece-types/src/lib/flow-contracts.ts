import { BaseModelSchema, DateOrString, Nullable } from "@activepieces/core-utils";
import * as z from "zod/mini";

export enum FlowStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export enum FlowTriggerType {
    EMPTY = 'EMPTY',
    PIECE = 'PIECE_TRIGGER',
}

export const StopResponse = z.object({
    status: z.optional(z.number()),
    body: z.optional(z.unknown()),
    headers: z.optional(z.record(z.string(), z.string())),
})
export type StopResponse = z.infer<typeof StopResponse>

export const Project = z.object({
    ...BaseModelSchema,
    deleted: Nullable(DateOrString),
    ownerId: z.string(),
    displayName: z.string(),
    platformId: z.string(),
    externalId: Nullable(z.string()),
})
export type Project = z.infer<typeof Project>

export const USE_DRAFT_QUERY_PARAM_NAME = 'useDraft'

export const PARENT_RUN_ID_HEADER = 'ap-parent-run-id'
export const FAIL_PARENT_ON_FAILURE_HEADER = 'ap-fail-parent-on-failure'
export const RAW_PAYLOAD_HEADER = 'ap-raw-payload'

export type PopulatedFlow = {
    id: string
    externalId?: string
    status: FlowStatus
    version: {
        displayName: string
        trigger: {
            type: FlowTriggerType
            settings: {
                pieceName?: string
                input: {
                    exampleData?: unknown
                } & Record<string, unknown>
            } & Record<string, unknown>
        }
    }
}
