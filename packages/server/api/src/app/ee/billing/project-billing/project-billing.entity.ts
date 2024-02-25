import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'
import { ProjectBilling } from '@activepieces/ee-shared'
import { Project } from '@activepieces/shared'

type ProjectBillingSchema = ProjectBilling & {
    project: Project
}

export const ProjectBillingEntity = new EntitySchema<ProjectBillingSchema>({
    name: 'project_billing',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        stripeCustomerId: {
            type: String,
        },
        includedTasks: {
            type: Number,
            nullable: true,
        },
        includedUsers: {
            type: Number,
            nullable: true,
        },
        stripeSubscriptionId: {
            type: String,
            nullable: true,
        },
        subscriptionStatus: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_stripe_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'one-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_project_stripe_project_id',
            },
        },
    },
})
