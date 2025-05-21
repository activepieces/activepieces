import { Platform, PlatformPlan } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type PlatformPlanSchema = PlatformPlan & {
    platform: Platform
}

export const PlatformPlanEntity = new EntitySchema<PlatformPlanSchema>({
    name: 'platform_plan',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        name: {
            type: String,
            nullable: true,
        },
        includedTasks: {
            type: Number,
        },
        tasksLimit: {
            type: Number,
            nullable: true,
        },
        includedAiCredits: {
            type: Number,
        },
        aiCreditsLimit: {
            type: Number,
            nullable: true,
        },
        environmentsEnabled: {
            type: Boolean,
        },
        analyticsEnabled: {
            type: Boolean,
        },
        showPoweredBy: {
            type: Boolean,
        },
        auditLogEnabled: {
            type: Boolean,
        },
        embeddingEnabled: {
            type: Boolean,
        },
        managePiecesEnabled: {
            type: Boolean,
        },
        manageTemplatesEnabled: {
            type: Boolean,
        },
        customAppearanceEnabled: {
            type: Boolean,
        },
        manageProjectsEnabled: {
            type: Boolean,
        },
        projectRolesEnabled: {
            type: Boolean,
        },
        customDomainsEnabled: {
            type: Boolean,
        },
        globalConnectionsEnabled: {
            type: Boolean,
        },
        customRolesEnabled: {
            type: Boolean,
        },
        apiKeysEnabled: {
            type: Boolean,
        },
        alertsEnabled: {
            type: Boolean,
        },
        ssoEnabled: {
            type: Boolean,
        },
        licenseKey: {
            type: String,
            nullable: true,
        },
        stripeCustomerId: {
            type: String,
            nullable: true,
        },
        stripeSubscriptionId: {
            type: String,
            nullable: true,
        },
        stripeSubscriptionStatus: {
            type: String,
            nullable: true,
        },
        tablesEnabled: {
            type: Boolean,
        },
        todosEnabled: {
            type: Boolean,
        },
    },
    indices: [
        {
            name: 'idx_platform_plan_platform_id',
            columns: ['platformId'],
            unique: true,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_platform_plan_platform_id',
            },
        },
    },
})
