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
        plan: {
            type: String,
            nullable: true,
        },
        tasksLimit: {
            type: Number,
            nullable: true,
        },
        includedAiCredits: {
            type: Number,
        },
        aiCreditsOverageLimit: {
            type: Number,
            nullable: true,
        },
        aiCreditsOverageState: {
            type: String,
            nullable: true,
        },
        eligibleForTrial: {
            type: String,
            nullable: true,
        },
        stripeSubscriptionStartDate: {
            type: Number,
            nullable: true,
        },
        stripeSubscriptionEndDate: {
            type: Number,
            nullable: true,
        },
        stripeSubscriptionCancelDate: {
            type: Number,
            nullable: true,
        },
        stripePaymentMethod: {
            type: String,
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
        agentsLimit: {
            type: Number,
            nullable: true,
        },
        stripeSubscriptionStatus: {
            type: String,
            nullable: true,
        },
        stripeBillingCycle: {
            type: String,
        },
        tablesEnabled: {
            type: Boolean,
        },
        todosEnabled: {
            type: Boolean,
        },
        userSeatsLimit: {
            type: Number,
            nullable: true,
        },
        projectsLimit: {
            type: Number,
            nullable: true,
        },
        tablesLimit: {
            type: Number,
            nullable: true,
        },
        agentsEnabled: {
            type: Boolean,
        },
        mcpLimit: {
            type: Number,
            nullable: true,
        },
        activeFlowsLimit: {
            type: Number,
            nullable: true,
        },
        mcpsEnabled: {
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
