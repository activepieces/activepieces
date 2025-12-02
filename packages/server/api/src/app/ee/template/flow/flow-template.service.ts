import { FlowTemplate, FlowTemplateScope, FlowVersionTemplate } from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    flowPieceUtil,
    isNil,
    ListFlowTemplatesRequestQuery,
    PlatformId,
    ProjectId,
    sanitizeObjectForPostgresql,
    SeekPage,
    spreadIfDefined,
} from '@activepieces/shared'
import { ArrayContains, ArrayOverlap, Equal, ILike } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { FlowTemplateEntity } from './flow-template.entity'

const flowTemplateRepo = repoFactory<FlowTemplate>(FlowTemplateEntity)

export const flowTemplateService = () => ({
    async create({ projectId, platformId, template, scope }: CreateParams): Promise<FlowTemplate> {
        const sanitizedTemplate: FlowVersionTemplate = sanitizeObjectForPostgresql(template)
        return flowTemplateRepo().save({
            id: apId(),
            template: sanitizedTemplate,
            pieces: flowPieceUtil.getUsedPieces(sanitizedTemplate.trigger),
            scope,
            platformId,
            projectId,
        })
    },

    async update({ id, template }: UpdateParams): Promise<FlowTemplate> {
        const flowTemplate = await flowTemplateRepo().findOneByOrFail({ id })
        return flowTemplateRepo().save({
            ...flowTemplate,
            ...spreadIfDefined('template', template),
        })
    },

    async list({ platformId, requestQuery }: ListParams): Promise<SeekPage<FlowTemplate>> {
        const { pieces, tags, search } = requestQuery
        const commonFilters: Record<string, unknown> = {}
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
        commonFilters.platformId = Equal(platformId)
        commonFilters.scope = Equal(FlowTemplateScope.PLATFORM)
        const templates = await flowTemplateRepo()
            .createQueryBuilder('flow_template')
            .where(commonFilters)
            .getMany()
        return paginationHelper.createPage(templates, null)
    },

    async getOrThrow({ id }: { id: string }): Promise<FlowTemplate> {
        const template = await flowTemplateRepo().findOneBy({
            id,
        })
        if (isNil(template)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Flow template ${id} is not found`,
                },
            })
        }
        return template
    },
})

type CreateParams = {
    projectId: ProjectId | undefined
    platformId: PlatformId | undefined
    template: FlowVersionTemplate
    scope: FlowTemplateScope
}

type ListParams = {
    platformId: PlatformId
    requestQuery: ListFlowTemplatesRequestQuery
}

type UpdateParams = {
    id: string
    template?: FlowVersionTemplate
}