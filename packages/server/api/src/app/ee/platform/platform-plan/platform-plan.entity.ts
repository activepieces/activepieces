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
        dataManipulationEnabled: {
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
            type: Number,
            nullable: true,
        },
        usersLimit: {
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
        billingEnforced: {
            type: Boolean,
            nullable: true,
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
