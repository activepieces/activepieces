import { apId, flowPieceUtil, FlowVersionTemplate, Metadata, sanitizeObjectForPostgresql, spreadIfDefined, Template, TemplateCategory, TemplateStatus, TemplateTag, TemplateType, UpdateTemplateRequestBody } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { TemplateEntity } from '../../template/template.entity'


const templateRepo = repoFactory<Template>(TemplateEntity)

export const platformTemplateService = () => ({
    async create({ platformId, name, summary, description, pieces, tags, blogUrl, metadata, author, categories, flows }: CreateParams): Promise<Template> {
        const newTags = tags ?? []
        const newTemplate: NewTemplate = {
            id: apId(),
            name,
            type: TemplateType.CUSTOM,
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
            flows,
            status: TemplateStatus.PUBLISHED,
        }
        return templateRepo().save(newTemplate)
    },
    async update({ id, params }: UpdateParams): Promise<Template> {
        const { name, description, summary, tags, blogUrl, metadata, categories, flows, status } = params
        const flow: FlowVersionTemplate | undefined = flows?.[0] ? sanitizeObjectForPostgresql(flows[0]) : undefined
        const pieces = flow ? flowPieceUtil.getUsedPieces(flow.trigger) : undefined
        await templateRepo().update(id, {
            ...spreadIfDefined('name', name),
            ...spreadIfDefined('description', description),
            ...spreadIfDefined('summary', summary),
            ...spreadIfDefined('tags', tags),
            ...spreadIfDefined('blogUrl', blogUrl),
            ...spreadIfDefined('metadata', metadata),
            ...spreadIfDefined('categories', categories),
            ...spreadIfDefined('flows', flows),
            ...spreadIfDefined('pieces', pieces),
            ...spreadIfDefined('status', status),
        })
        return templateRepo().findOneByOrFail({ id })
    },
})

type CreateParams = {
    platformId: string | undefined
    name: string
    summary: string
    description: string
    tags: TemplateTag[]
    blogUrl: string | undefined
    metadata: Metadata | null | undefined
    author: string
    categories: TemplateCategory[]
    flows: FlowVersionTemplate[]
    pieces: string[]
}

type NewTemplate = Omit<Template, 'created' | 'updated'>

type UpdateParams = {
    id: string
    params: UpdateTemplateRequestBody
}