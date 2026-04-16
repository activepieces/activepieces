import { JobData, WorkerJobType } from '@activepieces/shared'
import { eventDestinationJob } from './jobs/event-destination'
import { executeFlowJob } from './jobs/execute-flow'
import { executePollingJob } from './jobs/execute-polling'
import { executePropertyJob } from './jobs/execute-property'
import { executeTriggerHookJob } from './jobs/execute-trigger-hook'
import { executeActionJob } from './jobs/execute-action'
import { executeValidationJob } from './jobs/execute-validation'
import { executeWebhookJob } from './jobs/execute-webhook'
import { extractPieceInfoJob } from './jobs/extract-piece-info'
import { renewWebhookJob } from './jobs/renew-webhook'
import { JobHandler } from './types'

const registry: Record<WorkerJobType, JobHandler> = {
    [WorkerJobType.EXECUTE_FLOW]: executeFlowJob,
    [WorkerJobType.EXECUTE_POLLING]: executePollingJob,
    [WorkerJobType.EXECUTE_WEBHOOK]: executeWebhookJob,
    [WorkerJobType.RENEW_WEBHOOK]: renewWebhookJob,
    [WorkerJobType.EXECUTE_TRIGGER_HOOK]: executeTriggerHookJob,
    [WorkerJobType.EXECUTE_PROPERTY]: executePropertyJob,
    [WorkerJobType.EXECUTE_VALIDATION]: executeValidationJob,
    [WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION]: extractPieceInfoJob,
    [WorkerJobType.EVENT_DESTINATION]: eventDestinationJob,
    [WorkerJobType.EXECUTE_ACTION]: executeActionJob,
}

export function getHandler(jobType: WorkerJobType): JobHandler<JobData> {
    return registry[jobType]
}
