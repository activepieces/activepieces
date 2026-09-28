import { Runtime } from '@activepieces/sandbox'
import { ApLogger } from '@activepieces/server-utils'
import { ApiToWorkerContract, WorkerToApiContract } from '@activepieces/shared'

export function createApiToWorkerHandlers({ getRuntime, apiClient, getPublicApiUrl, log }: CreateApiToWorkerHandlersParams): ApiToWorkerContract {
    return {
        flowPublished({ flowId, flowVersionId, projectId }) {
            log.info({ flowId, flowVersionId, projectId, message: 'Flow published, prewarming flow cache' })
            void getRuntime()?.prewarm({
                log,
                apiClient,
                publicApiUrl: getPublicApiUrl(),
                flow: { id: flowId, versionId: flowVersionId, projectId },
            })
        },
        devPiecesRebuilt() {
            log.info('Dev pieces rebuilt, sandboxes will be replaced before their next job')
            getRuntime()?.markDevPiecesRebuilt()
        },
    }
}

type CreateApiToWorkerHandlersParams = {
    getRuntime: () => Runtime | null
    apiClient: WorkerToApiContract
    getPublicApiUrl: () => string
    log: ApLogger
}
