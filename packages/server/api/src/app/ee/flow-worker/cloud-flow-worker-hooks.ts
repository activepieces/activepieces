import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    FlowRunStatus,
} from '@activepieces/shared'
import { getEdition } from '../../helper/secret-helper'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { FlowWorkerHooks } from '../../workers/flow-worker/flow-worker-hooks'
import { exceptionHandler } from 'server-shared'
import { tasksLimit } from '../project-plan/tasks-limit'

export const platformWorkerHooks: FlowWorkerHooks = {
    async preExecute({
        projectId,
        runId,
    }: {
        projectId: string
        runId: string
    }): Promise<void> {
        const edition = getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            try {
                await tasksLimit.limit({
                    projectId,
                })
            }
            catch (e: unknown) {
                if (
                    e instanceof ActivepiecesError &&
                    (e as ActivepiecesError).error.code === ErrorCode.QUOTA_EXCEEDED
                ) {
                    await flowRunService.finish({
                        flowRunId: runId,
                        status: FlowRunStatus.QUOTA_EXCEEDED,
                        tasks: 0,
                        logsFileId: null,
                        tags: [],
                    })
                    return
                }
                else {
                    exceptionHandler.handle(e)
                }
            }
        }
    },
}
