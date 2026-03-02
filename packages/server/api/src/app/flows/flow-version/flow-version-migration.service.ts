import {
    AgentPieceProps,
    AgentProviderModelSchema,
    apId,
    flowStructureUtil,
    FlowVersion,
    FlowVersionState,
    isNil,
    LATEST_FLOW_SCHEMA_VERSION,
    MigrateFlowsModelRequest,
    MigrateFlowsModelResponse,
    PlatformId,
    sanitizeObjectForPostgresql,
    spreadIfDefined,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { system } from '../../helper/system/system'
import { flowExecutionCache } from '../flow/flow-execution-cache'
import { flowRepo } from '../flow/flow.repo'
import { flowVersionBackupService } from './flow-version-backup.service'
import { flowVersionRepo } from './flow-version.service'
import { flowMigrations } from './migrations'

const log = system.globalLogger()

export const flowVersionMigrationService = {
    async migrate(flowVersion: FlowVersion): Promise<FlowVersion> {
        // Early exit if already at latest version
        if (flowVersion.schemaVersion === LATEST_FLOW_SCHEMA_VERSION) {
            return flowVersion
        }

        log.info('Starting flow version migration')

        const backupFiles = flowVersion.backupFiles ?? {}
        if (!isNil(flowVersion.schemaVersion)) {
            backupFiles[flowVersion.schemaVersion] = await flowVersionBackupService.store(flowVersion)
        }

        const migratedFlowVersion: FlowVersion = await flowMigrations.apply(flowVersion)

        await flowVersionRepo().update(flowVersion.id, {
            schemaVersion: migratedFlowVersion.schemaVersion,
            ...spreadIfDefined('trigger', migratedFlowVersion.trigger),
            connectionIds: migratedFlowVersion.connectionIds,
            agentIds: migratedFlowVersion.agentIds,
            backupFiles,
        })
        log.info('Flow version migration completed')
        return migratedFlowVersion
    },

    async migrateFlowsModel(platformId: PlatformId, { projectIds, sourceModel, targetModel }: MigrateFlowsModelRequest): Promise<MigrateFlowsModelResponse> {
        const queryBuilder = flowVersionRepo()
            .createQueryBuilder('fv')
            .innerJoin('flow', 'f', 'f.id = fv."flowId"')
            .innerJoin('project', 'p', 'p.id = f."projectId"')
            .where('p."platformId" = :platformId', { platformId })
            .andWhere(`fv.id = (
                SELECT fv2.id FROM flow_version fv2
                WHERE fv2."flowId" = f.id
                ORDER BY fv2.created DESC LIMIT 1
            )`)

        if (!isNil(projectIds) && projectIds.length > 0) {
            queryBuilder.andWhere('f."projectId" IN (:...projectIds)', { projectIds })
        }

        const flowVersions = await queryBuilder.getMany()
        let updatedFlows = 0

        for (const flowVersion of flowVersions) {
            let hasChanges = false

            const updatedVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {

                if (!flowStructureUtil.isAgentPiece(step)) {
                    return step
                }
                const input = step.settings?.input as Record<string, unknown> | undefined
                let model = input?.model as string | undefined
                let provider = input?.provider as string | undefined

                if (step.settings.actionName === 'run_agent') {
                    const runAgentObject = input?.[AgentPieceProps.AI_PROVIDER_MODEL] as AgentProviderModelSchema | undefined
                    model = runAgentObject?.model
                    provider = runAgentObject?.provider
                }

              
                if (provider === sourceModel.provider && model === sourceModel.model) {
                    hasChanges = true
                    const clonedStep = JSON.parse(JSON.stringify(step))
                    clonedStep.settings.input['model'] = targetModel.model
                    clonedStep.settings.input['provider'] = targetModel.provider
                    if (step.settings.actionName === 'run_agent') {
                        clonedStep.settings.input[AgentPieceProps.AI_PROVIDER_MODEL] = targetModel
                    }
                    return clonedStep
                }
                return step
            })

            if (hasChanges) {
                const newVersion = sanitizeObjectForPostgresql({
                    ...updatedVersion,
                    id: apId(),
                    state: FlowVersionState.LOCKED,
                    created: dayjs().toISOString(),
                    updated: dayjs().toISOString(),
                })
                await flowVersionRepo().save(newVersion)
                await flowRepo().update(newVersion.flowId, { publishedVersionId: newVersion.id })
                await flowExecutionCache(log).invalidate(newVersion.flowId)
                updatedFlows++
            }
        }

        return { updatedFlows }
    },
}