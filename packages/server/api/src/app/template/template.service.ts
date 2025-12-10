import { ActivepiecesError, apId, CreateTemplateRequestBody, ErrorCode, flowPieceUtil, FlowVersionTemplate, isNil, ListTemplatesRequestQuery, sanitizeObjectForPostgresql, SeekPage, spreadIfDefined, Template, TemplateType, UpdateTemplateRequestBody } from '@activepieces/shared'
import { ArrayContains, ArrayOverlap, Equal } from 'typeorm'
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
        const pieces = Array.from(new Set(sanatizedFlows.map((flow) => flowPieceUtil.getUsedPieces(flow.trigger)).flat()))

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
                }
                return templateRepo().save(newTemplate)
            }
            case TemplateType.CUSTOM: {
                return platformTemplateService().create({ platformId, name, summary, description, pieces, tags: newTags, blogUrl, metadata, author, categories, flows: sanatizedFlows })
            }
        }
    },

    async update({ id, params }: UpdateParams): Promise<Template> {
        const { name, summary, description, tags, blogUrl, metadata, categories } = params
        const template = await templateService().getOneOrThrow({ id })

        const newTags = tags ?? []
        const sanatizedFlows: FlowVersionTemplate[] = params.flows?.map((flow) => sanitizeObjectForPostgresql(flow)) ?? []
        const pieces = Array.from(new Set(sanatizedFlows.map((flow) => flowPieceUtil.getUsedPieces(flow.trigger)).flat()))
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
                })
                return templateRepo().findOneByOrFail({ id })
            }
            case TemplateType.CUSTOM: {
                return platformTemplateService().update({ id, params })
            }
        }
    },

    async useTemplate({ id }: UseTemplateParams): Promise<void> {
        await templateRepo().increment({ id }, 'usageCount', 1)
    },  

    async list({ platformId, requestQuery }: ListParams): Promise<SeekPage<Template>> {
        const { pieces, tags, search, type, category } = requestQuery
        const commonFilters: Record<string, unknown> = {}
        if (pieces) {
            commonFilters.pieces = ArrayOverlap(pieces)
        }
        if (tags) {
            commonFilters.tags = ArrayContains(tags)
        }
        if (category) {
            commonFilters.categories = ArrayContains([category])
        }
        commonFilters.platformId = Equal(platformId)
        commonFilters.type = Equal(type)
        
        const queryBuilder = templateRepo()
            .createQueryBuilder('template')
            .where(commonFilters)
        
        if (search) {
            queryBuilder.andWhere(
                '(template.name ILIKE :search OR template.summary ILIKE :search OR template.description ILIKE :search)',
                { search: `%${search}%` },
            )
        }
        
        const templates = await queryBuilder.getMany()
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
    platformId: string
    requestQuery: ListTemplatesRequestQuery
}

type DeleteParams = {
    id: string
}

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}

type UseTemplateParams = {
    id: string
}