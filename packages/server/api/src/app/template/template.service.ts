import { ActivepiecesError, apId, CreateTemplateRequestBody, ErrorCode, flowPieceUtil, FlowVersionTemplate, isNil, ListTemplatesRequestQuery, sanitizeObjectForPostgresql, SeekPage, spreadIfDefined, Template, TemplateStatus, TemplateType, UpdateTemplateRequestBody } from '@activepieces/shared'
import { ArrayContains, ArrayOverlap, Equal, ILike, IsNull } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { platformTemplateService } from '../ee/template/platform-template.service'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { TemplateEntity } from './template.entity'

const templateRepo = repoFactory<Template>(TemplateEntity)

export const templateService = () => ({
    async getOneOrThrow({ id }: GetParams): Promise<Template> {
        const template = await templateRepo().findOneBy({ id })
        if (isNil(template)) {
            throw new ActivepiecesError({ 
                code: ErrorCode.ENTITY_NOT_FOUND, 
                params: { 
                    entityType: 'template',
                    entityId: id,
                    message: `Template ${id} not found`,
                },
            })
        }
        return template
    },
    async create({ platformId, params }: CreateParams): Promise<Template> {
        const { name, summary, description, tags, blogUrl, metadata, author, categories, type } = params
        const newTags = tags ?? []
        const sanatizedFlows: FlowVersionTemplate[] = params.flows?.map((flow) => sanitizeObjectForPostgresql(flow)) ?? []
        const pieces = sanatizedFlows.map((flow) => flowPieceUtil.getUsedPieces(flow.trigger)).flat()

        switch (type) {
            case TemplateType.OFFICIAL:
            case TemplateType.SHARED: {
                const newTemplate: NewTemplate = {
                    id: apId(),
                    name,
                    type,
                    summary,
                    description,
                    platformId,
                    tags: newTags,
                    blogUrl,
                    metadata,
                    author,
                    usageCount: 0,
                    categories,
                    pieces,
                    flows: sanatizedFlows,
                    status: TemplateStatus.PUBLISHED,
                }
                return templateRepo().save(newTemplate)
            }
            case TemplateType.CUSTOM: {
                return platformTemplateService().create({ platformId, name, summary, description, pieces, tags: newTags, blogUrl, metadata, author, categories, flows: sanatizedFlows })
            }
        }
    },

    async update({ id, params }: UpdateParams): Promise<Template> {
        const { name, summary, description, tags, blogUrl, metadata, categories, status } = params
        const template = await templateService().getOneOrThrow({ id })

        const newTags = tags ?? []
        const sanatizedFlows: FlowVersionTemplate[] = params.flows?.map((flow) => sanitizeObjectForPostgresql(flow)) ?? []
        const pieces = sanatizedFlows.map((flow) => flowPieceUtil.getUsedPieces(flow.trigger)).flat()
        switch (template.type) {
            case TemplateType.OFFICIAL:
            case TemplateType.SHARED: {
                await templateRepo().update(id, {
                    ...spreadIfDefined('name', name),
                    ...spreadIfDefined('summary', summary),
                    ...spreadIfDefined('description', description),
                    ...spreadIfDefined('tags', tags),
                    ...spreadIfDefined('blogUrl', blogUrl),
                    ...spreadIfDefined('metadata', metadata),
                    ...spreadIfDefined('categories', categories),
                    ...spreadIfDefined('flows', sanatizedFlows),
                    ...spreadIfDefined('pieces', pieces),
                    ...spreadIfDefined('tags', newTags),
                    ...spreadIfDefined('status', status),
                })
                return templateRepo().findOneByOrFail({ id })
            }
            case TemplateType.CUSTOM: {
                return platformTemplateService().update({ id, params })
            }
        }
    },

    async incrementUsageCount({ id }: IncrementUsageCountParams): Promise<void> {
        await templateRepo().increment({ id }, 'usageCount', 1)
    },  

    async list({ platformId, requestQuery }: ListParams): Promise<SeekPage<Template>> {
        const { pieces, tags, search, type } = requestQuery
        const commonFilters: Record<string, unknown> = {}
        const typeFilter = type ?? TemplateType.OFFICIAL

        if (pieces) {
            commonFilters.pieces = ArrayOverlap(pieces)
        }
        if (tags) {
            commonFilters.tags = ArrayContains(tags)
        }
        if (search) {
            commonFilters.name = ILike(`%${search}%`)
            commonFilters.description = ILike(`%${search}%`)
        }
        switch (typeFilter) {
            case TemplateType.OFFICIAL:
                commonFilters.type = Equal(TemplateType.OFFICIAL)
                commonFilters.platformId = IsNull()
                break
            case TemplateType.CUSTOM:
                commonFilters.type = Equal(TemplateType.CUSTOM)
                if (isNil(platformId)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: {
                            message: 'Platform ID is required to list custom templates',
                        },
                    })
                }
                commonFilters.platformId = Equal(platformId)
                break
            case TemplateType.SHARED:
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'Shared templates are not supported to being listed',
                    },
                })
        }
        commonFilters.status = Equal(TemplateStatus.PUBLISHED)
        const templates = await templateRepo()
            .createQueryBuilder('template')
            .where(commonFilters)
            .getMany()
        return paginationHelper.createPage(templates, null)
    },

    async delete({ id }: DeleteParams): Promise<void> {
        await templateRepo().delete({ id })
    },
})

type GetParams = {
    id: string
}

type CreateParams = {
    platformId: string | undefined
    params: CreateTemplateRequestBody
}

type NewTemplate = Omit<Template, 'created' | 'updated'>

type ListParams = {
    platformId: string | null
    requestQuery: ListTemplatesRequestQuery
}

type DeleteParams = {
    id: string
}

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}

type IncrementUsageCountParams = {
    id: string
}