import { ActivepiecesError, ApEdition, ErrorCode, ExecutionOutputStatus } from '@activepieces/shared'
import { getEdition } from '../../helper/secret-helper'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { captureException } from '@sentry/node'
import { FlowWorkerHooks } from '../../workers/flow-worker/flow-worker-hooks'
import { tasksLimit } from '../billing/limits/tasks-limit'

export const platformWorkerHooks: FlowWorkerHooks = {
    async preExecute({ projectId, runId }: { projectId: string, runId: string }): Promise<void> {
        const edition = getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            try {
                await tasksLimit.limit({
                    projectId,
                })
            }
            catch (e: unknown) {
                if (e instanceof ActivepiecesError && (e as ActivepiecesError).error.code === ErrorCode.QUOTA_EXCEEDED) {
                    await flowRunService.finish({ flowRunId: runId, status: ExecutionOutputStatus.QUOTA_EXCEEDED, tasks: 0, logsFileId: null, tags: [] })
                    return
                }
                else {
                    captureException(e)
                }
            }
        }
    },
}