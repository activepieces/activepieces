import { EntitySchema } from 'typeorm'
import { Project } from '@activepieces/shared'
import { Activity } from '@activepieces/ee-shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type ActivitySchema = Activity & {
    project: Project
}

export const ActivityEntity = new EntitySchema<ActivitySchema>({
    name: 'activity',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        event: {
            type: String,
            nullable: false,
        },
        message: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_activity_project_id_created_desc',
            columns: ['projectId', 'created'],
            unique: false,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_activity_project_id',
            },
        },
    },
})
