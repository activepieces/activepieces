import { ArrayContains, ArrayOverlap, Equal, ILike, IsNull } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { ActivepiecesError, ErrorCode, FlowTemplate, ProjectId, isNil } from '@activepieces/shared'
import { FlowTemplateEntity } from './flow-template.entity'
import { ListFlowTemplatesRequest } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

const templateRepo = databaseConnection.getRepository(FlowTemplateEntity)
const templateProjectId = system.get(SystemProp.TEMPLATES_PROJECT_ID)

export const flowTemplateService = {
    upsert: async ({ id, projectId, flowTemplate }: { id: string, projectId: ProjectId | undefined, flowTemplate: FlowTemplate }): Promise<FlowTemplate> => {
        await templateRepo.upsert({
            ...flowTemplate,
            // TODO fix this
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            template: flowTemplate.template as any,
            id,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId,
        }, ['id'])
        const template = await templateRepo.findOneByOrFail({
            id,
        })
        return template
    },
    update: async (id: string, flowTemplate: FlowTemplate): Promise<FlowTemplate> => {
        const temp = await templateRepo.findOneBy({
            id,
        })
        if (!temp) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `Template ${id} is not found`,
                },
            })
        }
        await templateRepo.update(id, {
            ...flowTemplate,
            id: temp.id,
            // TODO fix this
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            template: flowTemplate.template as any,
        })
        return templateRepo.findOneByOrFail({
            id,
        })
    },
    delete: async (id: string): Promise<void> => {
        await templateRepo.delete(id)
    },
    list: async ({ pieces, tags, featuredOnly, search }: ListFlowTemplatesRequest): Promise<FlowTemplate[]> => {
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
        return templates
    },
    getOrthrow: async (id: string): Promise<FlowTemplate> => {
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
}