import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'
import { FlowTemplate, Platform, Project, User } from '@activepieces/shared'

type FlowTemplateSchema = FlowTemplate & {
    project: Project
    platform: Platform
    user: User | null
}

export const FlowTemplateEntity = new EntitySchema<FlowTemplateSchema>({
    name: 'flow_template',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
        },
        platformId: {
            type: String,
            nullable: false,
        },
        projectId: {
            type: String,
        },
        template: {
            type: JSONB_COLUMN_TYPE,
        },
        tags: {
            type: String,
            array: true,
        },
        pieces: {
            type: String,
            array: true,
        },
        blogUrl: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_flow_template_tags',
            columns: ['tags'],
            unique: false,
        },
        {
            name: 'idx_flow_template_pieces',
            columns: ['pieces'],
            unique: false,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_flow_template_project_id',
            },
        },
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_flow_template_platform_id',
            },
        },
    },
})
