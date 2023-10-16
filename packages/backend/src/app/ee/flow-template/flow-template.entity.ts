import { EntitySchema } from 'typeorm'
import {  BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'
import { FlowTemplate, Project, ProjectId, User } from '@activepieces/shared'

export type FlowTemplateEntity = FlowTemplate & {
    id: string
    project: Project
    projectId: ProjectId
    user: User | null
    created: string
    updated: string
    isFeatured: boolean
    featuredDescription: string
}

export const FlowTemplateEntity = new EntitySchema<FlowTemplateEntity>({
    name: 'flow_template',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        description: {
            type: String,
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
        userId: {
            type: String,
            nullable: true,
        },
        imageUrl: {
            type: String,
            nullable: true,
        },
        isFeatured: {
            type: Boolean,
            nullable: true,
        },
        featuredDescription: {
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
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_flow_template_user_id',
            },


        },
    },
})
