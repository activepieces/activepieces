import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'


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

const CATEGORY_DISPLAY_NAMES: Record<TemplateCategory, string> = {
    [TemplateCategory.ANALYTICS]: 'Analytics',
    [TemplateCategory.COMMUNICATION]: 'Communication',
    [TemplateCategory.CONTENT]: 'Content',
    [TemplateCategory.CUSTOMER_SUPPORT]: 'Customer Support',
    [TemplateCategory.DEVELOPMENT]: 'Development',
    [TemplateCategory.E_COMMERCE]: 'E-Commerce',
    [TemplateCategory.FINANCE]: 'Finance',
    [TemplateCategory.HR]: 'HR',
    [TemplateCategory.IT_OPERATIONS]: 'IT Operations',
    [TemplateCategory.MARKETING]: 'Marketing',
    [TemplateCategory.PRODUCTIVITY]: 'Productivity',
    [TemplateCategory.SALES]: 'Sales',
}

const logger = system.globalLogger()

const isTemplateCategory = (category: string): category is TemplateCategory => {
    return Object.values(TemplateCategory).includes(category as TemplateCategory)
}

export class MigrateOldTemplateCategoriesToDynamicOne1767624311536 implements MigrationInterface {
    name = 'MigrateOldTemplateCategoriesToDynamicOne1767624311536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running migration MigrateOldTemplateCategoriesToDynamicOne1767624311536')

        const templates = await queryRunner.query(`
            SELECT * FROM "template"
        `)

        if (templates.length === 0) {
            logger.info('No templates to migrate')
            return
        }

        const allUpdatedCategories: Record<string, string[]> = {}

        for (const template of templates) {
            const id = template.id
            const categories = template.categories.map((category: string) => {
                if (isTemplateCategory(category)) {
                    return CATEGORY_DISPLAY_NAMES[category]
                }
                return category
            })
            
            allUpdatedCategories[id] = categories
        }

        const templateIds = Object.keys(allUpdatedCategories)

        if (templateIds.length > 0) {
            const updateStatements = Object.entries(allUpdatedCategories).map(([id, categories]) => {
                const categoriesArray = categories.map(c => `'${c.replace(/'/g, '\'\'')}'`).join(', ')
                return `UPDATE "template" SET "categories" = ARRAY[${categoriesArray}]::text[] WHERE "id" = '${id}'`
            }).join('; ')

            await queryRunner.query(updateStatements)
            logger.info(`Migrated ${templateIds.length} templates`)
        }

        logger.info('Finished migration MigrateOldTemplateCategoriesToDynamicOne1767624311536')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No down migration needed
    }

}
