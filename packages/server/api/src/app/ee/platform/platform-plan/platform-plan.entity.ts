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
        includedAiCredits: {
            type: Number,
        },
        aiCreditsAutoTopUpCreditsToAdd: {
            type: Number,
            nullable: true,
        },
        lastFreeAiCreditsRenewalDate: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        maxAutoTopUpCreditsMonthly: {
            type: Number,
            nullable: true,
        },
        aiCreditsAutoTopUpThreshold: {
            type: Number,
            nullable: true,
        },
        aiCreditsAutoTopUpState: {
            type: String,
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
        teamProjectsLimit: {
            type: String,
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
        projectsLimit: {
            type: Number,
            nullable: true,
        },
        agentsEnabled: {
            type: Boolean,
        },
        activeFlowsLimit: {
            type: Number,
            nullable: true,
        },
        mcpsEnabled: {
            type: Boolean,
        },
        dedicatedWorkers: {
            type: 'jsonb',
            nullable: true,
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
