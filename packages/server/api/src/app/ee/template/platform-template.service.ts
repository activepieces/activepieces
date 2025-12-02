import { ActivepiecesError, apId, CreateTemplateRequestBody, ErrorCode, isNil, ListTemplatesRequestQuery, PopulatedTemplate, SeekPage, spreadIfDefined, Template, UpdateTemplateRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { TemplateEntity } from '../../template/template.entity'
import { flowTemplateService } from './flow/flow-template.service'


const templateRepo = repoFactory<Template>(TemplateEntity)

export const platformTemplateService = () => ({
    async create({ platformId, projectId, params }: CreateParams): Promise<PopulatedTemplate> {
        const flowTemplate = await flowTemplateService().create({ projectId, platformId, template: params.template, scope: params.scope })

        const { name, description, tags, blogUrl, metadata, author, categories } = params

        const newTags = tags ?? []
        const newTemplate: NewTemplate = {
            id: apId(),
            name,
            description,
            tags: newTags,
            blogUrl,
            metadata,
            author,
            usageCount: 0,
            categories,
        }
        const savedTemplate = await templateRepo().save({
            ...newTemplate,
            flowTemplateId: flowTemplate.id,
        })
        return enrichTemplate(savedTemplate)
    },
    async update({ id, params }: UpdateParams): Promise<PopulatedTemplate> {
        const template = await templateRepo().findOneByOrFail({
            id,
        })
        await flowTemplateService().update({ id: template.flowTemplateId!, template: params.template })
        const { name, description, tags, blogUrl, metadata, categories } = params
        await templateRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('description', description),
            ...spreadIfDefined('tags', tags),
            ...spreadIfDefined('blogUrl', blogUrl),
            ...spreadIfDefined('metadata', metadata),
            ...spreadIfDefined('categories', categories),
        })
        return enrichTemplate(await templateRepo().findOneByOrFail({ id }))
    },
    async getOneOrThrow({ id }: { id: string }): Promise<Template> {
        const template = await templateRepo().findOneBy({
            id,
        })
        if (isNil(template)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Template ${id} is not found`,
                },
            })
        }
        return template
    },
    
    async getOnePopulatedOrThrow({ id }: { id: string }): Promise<PopulatedTemplate> {
        const template = await templateRepo().findOneBy({
            id,
        })
        if (isNil(template)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Template ${id} is not found`,
                },
            })
        }
        return enrichTemplate(template)
    },

    async list({ platformId, requestQuery }: ListParams): Promise<SeekPage<PopulatedTemplate>> {
        const flowTemplates = await flowTemplateService().list({ platformId, requestQuery })
        const populatedFlowTemplates = await Promise.all(flowTemplates.data.map(async (flowTemplate) => {
            const template = await templateRepo().findOneBy({ flowTemplateId: flowTemplate.id })
            if (isNil(template)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `Template ${flowTemplate.id} is not found`,
                    },
                })
            }
            return {
                ...template,
                flowTemplate,
            }
        }))
        return paginationHelper.createPage(populatedFlowTemplates, null)
    },

    async delete({ id }: { id: string }): Promise<void> {
        await templateRepo().delete({
            id,
        })
    },
})

async function enrichTemplate(template: Template): Promise<PopulatedTemplate> {
    const flowTemplate = isNil(template.flowTemplateId) ? undefined : await flowTemplateService().getOrThrow({ id: template.flowTemplateId })
    return {
        ...template,
        flowTemplate,
    }
}

type CreateParams = {
    platformId: string | undefined
    projectId: string | undefined
    params: CreateTemplateRequestBody
}

type NewTemplate = Omit<Template, 'created' | 'updated' | 'flowTemplateId'>

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}

type ListParams = {
    platformId: string
    requestQuery: ListTemplatesRequestQuery
}