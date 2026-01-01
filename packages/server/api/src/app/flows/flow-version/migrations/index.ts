import { FlowVersion, FlowVersionState, FlowVersionTemplate } from '@activepieces/shared'
import { migrateBranchToRouter } from './migrate-v0-branch-to-router'
import { migrateConnectionIds } from './migrate-v1-connection-ids'
import { migrateV10AiPiecesProviderId } from './migrate-v10-ai-pieces-provider-id'
import { migrateV11TablesToV2 } from './migrate-v11-tables-to-v2'
import { migrateAgentPieceV2 } from './migrate-v2-agent-piece'
import { migrateAgentPieceV3 } from './migrate-v3-agent-piece'
import { migrateAgentPieceV4 } from './migrate-v4-agent-piece'
import { migrateHttpToWebhookV5 } from './migrate-v5-http-to-webhook'
import { migratePropertySettingsV6 } from './migrate-v6-property-settings'
import { moveAgentsToFlowVerion } from './migrate-v7-agents-to-flow-version'
import { cleanUpAgentTools } from './migrate-v8-agent-tools'
import { migrateV9AiPieces } from './migrate-v9-ai-pieces'

export type Migration = {
    targetSchemaVersion: string | undefined
    migrate: (flowVersion: FlowVersion) => Promise<FlowVersion>
}

const migrations: Migration[] = [
    migrateBranchToRouter,
    migrateConnectionIds,
    migrateAgentPieceV2,
    migrateAgentPieceV3,
    migrateAgentPieceV4,
    migrateHttpToWebhookV5,
    migratePropertySettingsV6,
    moveAgentsToFlowVerion,
    cleanUpAgentTools,
    migrateV9AiPieces,
    migrateV10AiPiecesProviderId,
    migrateV11TablesToV2,
] as const

export const flowMigrations = {
    apply: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        for (const migration of migrations) {
            if (flowVersion.schemaVersion === migration.targetSchemaVersion) {
                flowVersion = await migration.migrate(flowVersion)
            }
        }
        return flowVersion
    },
}

export const migrateFlowVersionTemplate = async (trigger: FlowVersion['trigger'], schemaVersion: FlowVersion['schemaVersion']): Promise<FlowVersionTemplate> => {
    return flowMigrations.apply({
        agentIds: [],
        connectionIds: [],
        created: new Date().toISOString(),
        displayName: '',
        flowId: '',
        id: '',
        updated: new Date().toISOString(),
        updatedBy: '',
        valid: false,
        trigger,
        state: FlowVersionState.DRAFT,
        schemaVersion,
    })
}