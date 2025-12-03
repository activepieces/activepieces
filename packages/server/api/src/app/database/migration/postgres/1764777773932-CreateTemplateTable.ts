import { AppSystemProp } from '@activepieces/server-shared'
import { apId, FlowVersion, isNil } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { Static, Type } from '@sinclair/typebox'

const cloudPlatformId = system.get(AppSystemProp.CLOUD_PLATFORM_ID)
const logger = system.globalLogger()

enum ColorName {
    RED = 'RED',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
    PINK = 'PINK',
    VIOLET = 'VIOLET',
    ORANGE = 'ORANGE',
    DARK_GREEN = 'DARK_GREEN',
    CYAN = 'CYAN',
    LAVENDER = 'LAVENDER',
    DEEP_ORANGE = 'DEEP_ORANGE',
}

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

const TemplateTag = Type.Object({
    title: Type.String(),
    color: Type.Enum(ColorName),
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


const Collection = Type.Object({
    flowTemplates: Type.Optional(Type.Array(FlowVersionTemplate)),
})
type Collection = Static<typeof Collection>

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
                "description" character varying NOT NULL,
                "collection" jsonb NOT NULL,
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

        const flowTemplates = await queryRunner.query(`
            SELECT * FROM "flow_template"
        `)
        
        if (flowTemplates.length === 0) {
            console.log('No flow templates to migrate')
            return
        }

        const templateValues: unknown[][] = []
        
        for (const flowTemplate of flowTemplates) {
            const id = apId()
            const name = flowTemplate.name
            const description = flowTemplate.description || ''
            const collection: Collection = {
                flowTemplates: [flowTemplate.template],
            }
            const tags: TemplateTag[] = flowTemplate.tags.map((tag: string) => ({
                title: tag,
                color: ColorName.BLUE,
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
                description,
                JSON.stringify(collection),
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
            const offset = index * 13
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`
        }).join(', ')

        const flattenedValues = templateValues.flat()

        await queryRunner.query(`
            INSERT INTO "template" ("id", "name", "description", "collection", "tags", "blogUrl", "metadata", "usageCount", "author", "categories", "pieces", "type", "platformId") 
            VALUES ${valuesPlaceholders}
        `, flattenedValues)
        
        console.log(`Migrated ${flowTemplates.length} flow templates`)

        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_template" DROP CONSTRAINT "fk_flow_template_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_pieces"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_template_tags"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_template"
        `)
        logger.info('Dropped flow_template table')
        logger.info('Finished migration CreateTemplateTable1764777773932')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No thing to do here
    }

}
