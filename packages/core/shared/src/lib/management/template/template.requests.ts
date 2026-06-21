import { z } from 'zod'
import { Metadata, Nullable, OptionalArrayFromQuery } from '../../core/common'
import { FlowVersionTemplate, TemplateStatus, TemplateTag, TemplateType } from './template'

export const CreateTemplateRequestBody = z.object({
    name: z.string(),
    summary: z.string(),
    description: z.string(),
    tags: z.array(TemplateTag).optional(),
    blogUrl: z.string().optional(),
    metadata: Nullable(Metadata),
    author: z.string(),
    categories: z.array(z.string()),
    type: z.nativeEnum(TemplateType),
    flows: z.array(FlowVersionTemplate).optional(),
})
export type CreateTemplateRequestBody = z.infer<typeof CreateTemplateRequestBody>

export const UpdateFlowTemplateRequestBody = z.object({
    name: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(TemplateTag).optional(),
    blogUrl: z.string().optional(),
    metadata: Nullable(Metadata),
    status: z.nativeEnum(TemplateStatus).optional(),
    categories: z.array(z.string()).optional(),
    flows: z.array(FlowVersionTemplate).optional(),
})
export type UpdateFlowTemplateRequestBody = z.infer<typeof UpdateFlowTemplateRequestBody>

export const UpdateTemplateRequestBody = UpdateFlowTemplateRequestBody
export type UpdateTemplateRequestBody = z.infer<typeof UpdateTemplateRequestBody>

export const ListFlowTemplatesRequestQuery = z.object({
    type: z.nativeEnum(TemplateType).optional(),
    pieces: OptionalArrayFromQuery(z.string()),
    tags: OptionalArrayFromQuery(z.string()),
    search: z.string().optional(),
    category: z.string().optional(),
})
export type ListFlowTemplatesRequestQuery = z.infer<typeof ListFlowTemplatesRequestQuery>

export const ListTemplatesRequestQuery = ListFlowTemplatesRequestQuery
export type ListTemplatesRequestQuery = z.infer<typeof ListTemplatesRequestQuery>
