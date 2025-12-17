import { Platform, Template } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'

type TemplateSchema = Template & {
    platform: Platform
}

export const TemplateEntity = new EntitySchema<TemplateSchema>({
    name: 'template',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        summary: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: false,
        },
        flows: {
            type: 'jsonb',
            nullable: false,
        },
        tags: {
            type: 'jsonb',
            nullable: false,
        },
        blogUrl: {
            type: String,
            nullable: true,
        },
        metadata: {
            type: 'jsonb',
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
            type: String,
            array: true,
            nullable: false,
        },
        pieces: {
            type: String,
            array: true,
        },
    },
    indices: [
        {
            name: 'idx_template_pieces',
            columns: ['pieces'],
            unique: false,
        },
        {
            name: 'idx_template_categories',
            columns: ['categories'],
            unique: false,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_template_platform_id',
            },
        },
    },
})
