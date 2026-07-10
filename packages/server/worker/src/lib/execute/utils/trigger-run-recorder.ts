import { tryCatch } from '@activepieces/core-utils'
import { ApLogger } from '@activepieces/server-utils'
import { EngineResponseStatus, FlowTriggerType, FlowVersion, TriggerRunStatus, WorkerToApiContract } from '@activepieces/shared'

export async function recordTriggerRun({ apiClient, log, flowVersion, platformId, status }: RecordTriggerRunParams): Promise<void> {
    if (flowVersion.trigger.type !== FlowTriggerType.PIECE) {
        return
    }
    const pieceName = flowVersion.trigger.settings.pieceName
    const triggerRunStatus = status === EngineResponseStatus.OK ? TriggerRunStatus.COMPLETED : TriggerRunStatus.FAILED
    const { error } = await tryCatch(() => apiClient.recordTriggerRun({ platformId, pieceName, status: triggerRunStatus }))
    if (error) {
        log.warn({ error: String(error), piece: { name: pieceName }, flowVersion: { id: flowVersion.id } }, 'Failed to record trigger run stats')
    }
}

type RecordTriggerRunParams = {
    apiClient: WorkerToApiContract
    log: ApLogger
    flowVersion: FlowVersion
    platformId: string
    status: EngineResponseStatus
}
