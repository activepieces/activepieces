import { FlowVersion, isNil, TemplateStatus } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const cloudPlatformId = 'NgixMLyPUxy1ZgCcxw5cM'
const logger = system.globalLogger()

enum TemplateCategory {
    ANALYTICS = 'ANALYTICS',
    COMMUNICATION = 'COMMUNICATION',
    CONTENT = 'CONTENT',
    CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
    DEVELOPMENT = 'DEVELOPMENT',
    E_COMMERCE = 'E_COMMERCE',
    FINANCE = 'FINANCE',
    HR = 'HR',
    IT_OPERATIONS = 'IT_OPERATIONS',
    MARKETING = 'MARKETING',
    PRODUCTIVITY = 'PRODUCTIVITY',
    SALES = 'SALES',
}
const ColorHex = Type.String({
    pattern: '^#[0-9A-Fa-f]{6}$',
})
type ColorHex = Static<typeof ColorHex>


const TemplateTag = Type.Object({
    title: Type.String(),
    color: ColorHex,
    icon: Type.Optional(Type.String()),
})
type TemplateTag = Static<typeof TemplateTag>

enum TemplateType {
    OFFICIAL = 'OFFICIAL',
    SHARED = 'SHARED',
    CUSTOM = 'CUSTOM',
}

const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles'],
)
type FlowVersionTemplate = Static<typeof FlowVersionTemplate>


export class MigrateOldTemplatesToNewSchema1765993826655 implements MigrationInterface {
    name = 'MigrateOldTemplatesToNewSchema1765993826655'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "template" WHERE "created" = (SELECT MIN("created") FROM "template")
        `)

        const isTableExists = await queryRunner.hasTable('flow_template')

        if (!isTableExists) {
            logger.info('flow_template table does not exist, skipping migration')
            return
        }

        const flowTemplates = await queryRunner.query(`
            SELECT * FROM "flow_template"
        `)
        
        if (flowTemplates.length === 0) {
            logger.info('No flow templates to migrate')
            return
        }

        const templateValues: unknown[][] = []
        
        for (const flowTemplate of flowTemplates) {
            const id = flowTemplate.id
            const name = flowTemplate.name
            const summary = flowTemplate.description || ''
            const description = flowTemplate.description || ''
            const flows: FlowVersionTemplate[] = [flowTemplate.template]
            const tags: TemplateTag[] = flowTemplate.tags.map((tag: string) => ({
                title: tag,
                color: '#e4fded',
                icon: undefined,
            }))
            const blogUrl = flowTemplate.blogUrl
            const metadata = flowTemplate.metadata
            const usageCount = 0
            const author = flowTemplate.platformId === cloudPlatformId ? 'Activepieces Team' : isNil(flowTemplate.projectId) ? '' : 'Platform Admin'
            const categories: TemplateCategory[] = []
            const pieces = flowTemplate.pieces
            const type = flowTemplate.platformId === cloudPlatformId ? TemplateType.OFFICIAL : isNil(flowTemplate.projectId) ? TemplateType.CUSTOM : TemplateType.SHARED
            const platformId = flowTemplate.platformId === cloudPlatformId ? null : flowTemplate.platformId
            const status = TemplateStatus.PUBLISHED

            templateValues.push([
                id,
                name,
                summary,
                description,
                JSON.stringify(flows),
                JSON.stringify(tags),
                blogUrl,
                metadata ? JSON.stringify(metadata) : null,
                usageCount,
                author,
                categories,
                pieces,
                type,
                platformId,
                status,
            ])
        }

        const valuesPlaceholders = templateValues.map((_, index) => {
            const offset = index * 15
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`
        }).join(', ')

        const flattenedValues = templateValues.flat()

        await queryRunner.query(`
            INSERT INTO "template" ("id", "name", "summary", "description", "flows", "tags", "blogUrl", "metadata", "usageCount", "author", "categories", "pieces", "type", "platformId", "status") 
            VALUES ${valuesPlaceholders}
        `, flattenedValues)
        
        logger.info(`Finished migration MigrateOldTemplatesToNewSchema1765993826655, migrated ${flowTemplates.length} flow templates`)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No thing to do here
    }

}
