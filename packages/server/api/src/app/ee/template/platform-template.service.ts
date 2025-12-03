import { apId, Collection, flowPieceUtil, FlowVersionTemplate, Metadata, sanitizeObjectForPostgresql, spreadIfDefined, Template, TemplateCategory, TemplateTag, TemplateType, UpdateTemplateRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { TemplateEntity } from '../../template/template.entity'


const templateRepo = repoFactory<Template>(TemplateEntity)

export const platformTemplateService = () => ({
    async create({ platformId, name, description, pieces, tags, blogUrl, metadata, author, categories, collection }: CreateParams): Promise<Template> {
        const newTags = tags ?? []
        const newTemplate: NewTemplate = {
            id: apId(),
            name,
            type: TemplateType.CUSTOM,
            description,
            platformId,
            tags: newTags,
            blogUrl,
            metadata,
            author,
            usageCount: 0,
            categories,
            pieces,
            collection,
        }
        return templateRepo().save(newTemplate)
    },
    async update({ id, params }: UpdateParams): Promise<Template> {
        const { name, description, tags, blogUrl, metadata, categories, collection } = params
        const flowTemplate: FlowVersionTemplate | undefined = collection?.flowTemplates?.[0] ? sanitizeObjectForPostgresql(collection.flowTemplates[0]) : undefined
        const pieces = flowTemplate ? flowPieceUtil.getUsedPieces(flowTemplate.trigger) : undefined
        await templateRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('description', description),
            ...spreadIfDefined('tags', tags),
            ...spreadIfDefined('blogUrl', blogUrl),
            ...spreadIfDefined('metadata', metadata),
            ...spreadIfDefined('categories', categories),
            ...spreadIfDefined('collection', collection),
            ...spreadIfDefined('pieces', pieces),
        })
        return templateRepo().findOneByOrFail({ id })
    },
})

type CreateParams = {
    platformId: string | undefined
    name: string
    description: string
    tags: TemplateTag[]
    blogUrl: string | undefined
    metadata: Metadata | null | undefined
    author: string
    categories: TemplateCategory[]
    collection: Collection
    pieces: string[]
}

type NewTemplate = Omit<Template, 'created' | 'updated'>

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}