import { ApId, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

export const PieceSetConfig = z.object({
    disabledPieces: z.array(z.string()).default([]),
    disabledActions: z.record(z.string(), z.array(z.string())).default({}),
    disabledTriggers: z.record(z.string(), z.array(z.string())).default({}),
})
export type PieceSetConfig = z.infer<typeof PieceSetConfig>

export const PieceSet = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    name: z.string(),
    externalId: Nullable(z.string()),
    isDefault: z.boolean(),
    includeNewPieces: z.boolean(),
    includeNewActions: z.boolean(),
    generatedForProjectId: Nullable(ApId),
    config: PieceSetConfig,
})
export type PieceSet = z.infer<typeof PieceSet>

export const CreatePieceSetRequestBody = z.object({
    name: z.string().min(1, { message: formErrors.required }),
    externalId: z.string().optional(),
    includeNewPieces: z.boolean().optional().default(true),
    includeNewActions: z.boolean().optional().default(true),
})
export type CreatePieceSetRequestBody = z.infer<typeof CreatePieceSetRequestBody>

export const UpdatePieceSetRequestBody = z.object({
    name: z.string().min(1, { message: formErrors.required }).optional(),
    externalId: z.string().nullable().optional(),
    includeNewPieces: z.boolean().optional(),
    includeNewActions: z.boolean().optional(),
    enablePieces: z.array(z.string()).optional(),
    disablePieces: z.array(z.string()).optional(),
    enableActions: z.record(z.string(), z.array(z.string())).optional(),
    disableActions: z.record(z.string(), z.array(z.string())).optional(),
    enableTriggers: z.record(z.string(), z.array(z.string())).optional(),
    disableTriggers: z.record(z.string(), z.array(z.string())).optional(),
})
export type UpdatePieceSetRequestBody = z.infer<typeof UpdatePieceSetRequestBody>

export const DuplicatePieceSetRequestBody = z.object({
    name: z.string().min(1, { message: formErrors.required }),
})
export type DuplicatePieceSetRequestBody = z.infer<typeof DuplicatePieceSetRequestBody>

export const AssignProjectsRequestBody = z.object({
    projectIds: z.array(ApId).min(1, { message: formErrors.required }),
})
export type AssignProjectsRequestBody = z.infer<typeof AssignProjectsRequestBody>

export const ListPieceSetsRequestQuery = z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(10),
})
export type ListPieceSetsRequestQuery = z.infer<typeof ListPieceSetsRequestQuery>
