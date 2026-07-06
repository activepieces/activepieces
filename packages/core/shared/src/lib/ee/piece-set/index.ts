import { ApId, BaseModelSchema, isNil, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

export function isPieceVisible({ pieces, name }: { pieces: PieceSelection, name: string }): boolean {
    const listed = pieces.exceptions.includes(name)
    return pieces.mode === 'include_all' ? !listed : listed
}

export function isComponentVisible({ selected, name }: { selected: string[] | undefined, name: string }): boolean {
    if (isNil(selected)) {
        return true
    }
    return selected.includes(name)
}

export const PieceSelectionMode = z.enum(['include_all', 'exclude_all'])
export type PieceSelectionMode = z.infer<typeof PieceSelectionMode>

export const PieceSelection = z.object({
    mode: PieceSelectionMode.default('include_all'),
    exceptions: z.array(z.string()).default([]),
})
export type PieceSelection = z.infer<typeof PieceSelection>

export const PieceSetConfig = z.object({
    pieces: PieceSelection.default({ mode: 'include_all', exceptions: [] }),
    selectedActions: z.record(z.string(), z.array(z.string())).default({}),
    selectedTriggers: z.record(z.string(), z.array(z.string())).default({}),
})
export type PieceSetConfig = z.infer<typeof PieceSetConfig>

export const PieceSet = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    name: z.string(),
    externalId: Nullable(z.string()),
    isDefault: z.boolean(),
    generatedForProjectId: Nullable(ApId),
    config: PieceSetConfig,
})
export type PieceSet = z.infer<typeof PieceSet>

export const ComponentIntent = z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('all') }),
    z.object({ mode: z.literal('selected'), selected: z.array(z.string()) }),
])
export type ComponentIntent = z.infer<typeof ComponentIntent>

export const CreatePieceSetRequestBody = z.object({
    name: z.string().min(1, { message: formErrors.required }),
    externalId: z.string().optional(),
})
export type CreatePieceSetRequestBody = z.infer<typeof CreatePieceSetRequestBody>

export const UpdatePieceSetRequestBody = z.object({
    name: z.string().min(1, { message: formErrors.required }).optional(),
    externalId: z.string().nullable().optional(),
    pieces: PieceSelection.optional(),
    actions: z.record(z.string(), ComponentIntent).optional(),
    triggers: z.record(z.string(), ComponentIntent).optional(),
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
