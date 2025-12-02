import { FlowTemplate } from '@activepieces/ee-shared'
import { Template } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
    JSONB_COLUMN_TYPE } from '../database/database-common'

type TemplateSchema = Template & {
    flowTemplate: FlowTemplate
}

export const TemplateEntity = new EntitySchema<TemplateSchema>({
    name: 'template',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: false,
        },
        flowTemplateId: {
            ...ApIdSchema,
            nullable: true,
        },
        tags: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        blogUrl: {
            type: String,
            nullable: true,
        },
        metadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        usageCount: {
            type: Number,
            nullable: false,
        },
        author: {
            type: String,
            nullable: false,
        },
        categories: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_template_flow_template_id',
            columns: ['flowTemplateId'],
            unique: false,
        },
        {
            name: 'idx_template_categories',
            columns: ['categories'],
            unique: false,
        },
    ],
    relations: {
        flowTemplate: {
            type: 'many-to-one',
            target: 'flow_template',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowTemplateId',
                foreignKeyConstraintName: 'fk_template_flow_template_id',
            },
        },
    },
})
