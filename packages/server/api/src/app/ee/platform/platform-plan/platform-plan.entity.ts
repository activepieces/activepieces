import { Platform, PlatformPlan } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type PlatformPlanSchema = PlatformPlan & {
    platform: Platform
    autumnCustomerId: string | null
    autumnApiKey: string | null
} & RetiredPlatformPlanColumns

/**
 * @deprecated Columns the Autumn migration deliberately leaves in the database so a revert to
 * pre-Autumn code still finds the schema it expects (decision 000019). Never read or written by
 * this codebase — declared only so the entity matches the migrated schema. Dropped, along with
 * these declarations, by the cleanup migration that closes the revert window.
 */
type RetiredPlatformPlanColumns = {
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripeSubscriptionStatus: string | null
    stripeSubscriptionStartDate: number | null
    stripeSubscriptionEndDate: number | null
    stripeSubscriptionCancelDate: number | null
    aiCreditsAutoTopUpState: string
    aiCreditsAutoTopUpThreshold: number | null
    aiCreditsAutoTopUpCreditsToAdd: number | null
    maxAutoTopUpCreditsMonthly: number | null
    lastFreeAiCreditsRenewalDate: Date | null
    includedAiCredits: number
    agentsEnabled: boolean
    teamProjectsLimit: string
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
        includedCredits: {
            type: Number,
            default: 0,
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
        aiProvidersEnabled: {
            type: Boolean,
            default: false,
        },
        chatEnabled: {
            type: Boolean,
        },
        workerGroupsEnabled: {
            type: Boolean,
            default: false,
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
        billedTeamProjectsLimit: {
            type: Number,
            nullable: true,
        },
        usersLimit: {
            type: Number,
            nullable: true,
        },
        scheduledUsersLimit: {
            type: Number,
            nullable: true,
        },
        projectRolesEnabled: {
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
        scimEnabled: {
            type: Boolean,
        },
        licenseKey: {
            type: String,
            nullable: true,
        },
        autumnCustomerId: {
            type: String,
            nullable: true,
        },
        autumnApiKey: {
            type: String,
            nullable: true,
        },
        projectsLimit: {
            type: Number,
            nullable: true,
        },
        tablesEnabled: {
            type: Boolean,
        },
        activeFlowsLimit: {
            type: Number,
            nullable: true,
        },
        eventStreamingEnabled: {
            type: Boolean,
        },
        secretManagersEnabled: {
            type: Boolean,
        },
        /** @deprecated use workerGroupId instead — will be removed in 0.83.0 */
        dedicatedWorkers: {
            type: 'jsonb',
            nullable: true,
        },
        /** @deprecated use workerGroupId instead — will be removed in 0.83.0 */
        canary: {
            type: Boolean,
            default: false,
        },
        /** @deprecated custom domains have been removed; column kept for backwards compatibility with existing DBs */
        customDomainsEnabled: {
            type: Boolean,
            nullable: false,
        },
        workerGroupId: {
            type: String,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeCustomerId: {
            type: String,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeSubscriptionId: {
            type: String,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeSubscriptionStatus: {
            type: String,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeSubscriptionStartDate: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeSubscriptionEndDate: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        stripeSubscriptionCancelDate: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        aiCreditsAutoTopUpState: {
            type: String,
            default: 'disabled',
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        aiCreditsAutoTopUpThreshold: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        aiCreditsAutoTopUpCreditsToAdd: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        maxAutoTopUpCreditsMonthly: {
            type: Number,
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        lastFreeAiCreditsRenewalDate: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        includedAiCredits: {
            type: Number,
            default: 0,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        agentsEnabled: {
            type: Boolean,
            default: true,
        },
        /** @deprecated see RetiredPlatformPlanColumns */
        teamProjectsLimit: {
            type: String,
            default: 'NONE',
        },
    },
    indices: [
        {
            name: 'idx_platform_plan_platform_id',
            columns: ['platformId'],
            unique: true,
        },
        {
            name: 'idx_platform_plan_worker_group_id',
            columns: ['workerGroupId'],
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
