import { FlowTemplate } from '@activepieces/ee-shared'
import { Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../../database/database-common'

type FlowTemplateSchema = FlowTemplate & {
    project: Project
    platform: Platform
}

export const FlowTemplateEntity = new EntitySchema<FlowTemplateSchema>({
    name: 'flow_template',
    columns: {
        ...BaseColumnSchemaPart,
        scope: {
            type: String,
            nullable: false,
        },
        platformId: {
            type: String,
            nullable: false,
        },
        projectId: {
            type: String,
            nullable: true,
        },
        template: {
            type: JSONB_COLUMN_TYPE,
        },
        pieces: {
            type: String,
            array: true,
        },
    },
    indices: [
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
