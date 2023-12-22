import { ArrayContains, ArrayOverlap, Equal, ILike, IsNull } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { ActivepiecesError, ListFlowTemplatesRequest, ErrorCode, FlowTemplate, SeekPage, isNil, apId, FlowVersionTemplate, flowHelper } from '@activepieces/shared'
import { FlowTemplateEntity } from './flow-template.entity'
import { CreateFlowTemplateRequest } from '@activepieces/ee-shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { flowRepo } from '../../flows/flow/flow.repo'

const templateRepo = databaseConnection.getRepository<FlowTemplate>(FlowTemplateEntity)
const templateProjectId = system.get(SystemProp.TEMPLATES_PROJECT_ID)

export const flowTemplateService = {
    upsert: async (projectId: string, { template, featuredDescription, blogUrl, imageUrl, isFeatured, tags }: CreateFlowTemplateRequest): Promise<FlowTemplate> => {
        const id = apId()
        const flowTemplate: FlowVersionTemplate = template
        await templateRepo.upsert({
            id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            template: flowTemplate as any, 
            pieces: flowHelper.getUsedPieces(flowTemplate.trigger),
            featuredDescription,
            imageUrl,
            blogUrl,
            tags,
            isFeatured,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId,
        }, ['id'])
        return templateRepo.findOneByOrFail({
            id,
        })
    },
    list: async (platformId: string | null, { pieces, tags, featuredOnly, search }: ListFlowTemplatesRequest): Promise<SeekPage<FlowTemplate>> => {
        const conditions: Record<string, unknown> = {
            projectId: isNil(templateProjectId) ? IsNull() : Equal(templateProjectId),
        }
        if (featuredOnly !== undefined) {
            if (featuredOnly) {
                conditions.isFeatured = Equal(true)
            }
        }

        if (pieces) {
            conditions.pieces = ArrayOverlap(pieces)
        }
        if (tags) {
            conditions.tags = ArrayContains(tags)
        }

        if (search) {
            conditions.name = ILike(`%${search}%`)
            conditions.description = ILike(`%${search}%`)
        }
        const templates = await templateRepo.createQueryBuilder('flow_template')
            .leftJoinAndSelect('flow_template.user', 'user')
            .where(conditions)
            .select(['user.firstName', 'user.lastName', 'user.email', 'user.title', 'user.imageUrl', 'flow_template'])
            .getMany()
        return paginationHelper.createPage(templates, null)
    },
    getOrThrow: async (id: string): Promise<FlowTemplate> => {
        const template = await templateRepo.createQueryBuilder('flow_template')
            .leftJoinAndSelect('flow_template.user', 'user')
            .where('flow_template.id = :templateId', { templateId: id })
            .select(['user.firstName', 'user.lastName', 'user.email', 'user.title', 'user.imageUrl', 'flow_template'])
            .getOne()
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
    async delete({id, projectId}: {id: string, projectId: string}){
        await flowRepo.delete({
            id,
            projectId
        })
    }
}