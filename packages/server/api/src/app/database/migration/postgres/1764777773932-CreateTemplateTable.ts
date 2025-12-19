import { apId, FlowVersion, isNil } from '@activepieces/shared'
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


export class CreateTemplateTable1764777773932 implements MigrationInterface {
    name = 'CreateTemplateTable1764777773932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration CreateTemplateTable1764777773932')
        
        await queryRunner.query(`
            CREATE TABLE "template" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying,
                "type" character varying NOT NULL,
                "name" character varying NOT NULL,
                "summary" character varying NOT NULL,
                "description" character varying NOT NULL,
                "flows" jsonb NOT NULL,
                "tags" jsonb NOT NULL,
                "blogUrl" character varying,
                "metadata" jsonb,
                "usageCount" integer NOT NULL,
                "author" character varying NOT NULL,
                "categories" character varying array NOT NULL,
                "pieces" character varying array NOT NULL,
                CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_template_pieces" ON "template" ("pieces")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_template_categories" ON "template" ("categories")
        `)
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD CONSTRAINT "fk_template_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            const id = apId()
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
            const author = flowTemplate.platformId === cloudPlatformId ? 'Activepieces Team' : 'Platform Admin'
            const categories: TemplateCategory[] = []
            const pieces = flowTemplate.pieces
            const type = flowTemplate.platformId === cloudPlatformId ? TemplateType.OFFICIAL : isNil(flowTemplate.projectId) ? TemplateType.CUSTOM : TemplateType.SHARED
            const platformId = flowTemplate.platformId
            
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
            ])
        }

        const valuesPlaceholders = templateValues.map((_, index) => {
            const offset = index * 14
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`
        }).join(', ')

        const flattenedValues = templateValues.flat()

        await queryRunner.query(`
            INSERT INTO "template" ("id", "name", "summary", "description", "flows", "tags", "blogUrl", "metadata", "usageCount", "author", "categories", "pieces", "type", "platformId") 
            VALUES ${valuesPlaceholders}
        `, flattenedValues)
        
        logger.info(`Finished migration CreateTemplateTable1764777773932, migrated ${flowTemplates.length} flow templates`)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No thing to do here
    }

}