import { tryCatch } from '@activepieces/core-utils'
import { type ApLogger, safeHttp } from '@activepieces/server-utils'
import { ConsumeJobRequest } from '@activepieces/shared'
import { GoogleAuth, IdTokenClient } from 'google-auth-library'

const EXECUTE_PATH = '/v1/execute'
// Cloud Run's request timeout ceiling is 60min. The worker holds this request open for the whole run:
// the open request is what keeps the autoscaled instance alive, and is our per-slot backpressure.
const REQUEST_TIMEOUT_MS = 60 * 60 * 1000

export function createCloudRunDispatcher({ baseUrl }: CreateCloudRunDispatcherParams): CloudRunDispatcher {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
    const url = normalizedBaseUrl + EXECUTE_PATH
    const httpClient = safeHttp.createAxios({ timeout: REQUEST_TIMEOUT_MS })
    const resolveAuthHeaders = buildOidcHeaderResolver({ audience: normalizedBaseUrl })
    return {
        async dispatch({ job, log }: DispatchParams): Promise<void> {
            const { data: headers, error: authError } = await tryCatch(() => resolveAuthHeaders())
            if (authError) {
                log.error({ error: String(authError), job: { id: job.jobId } }, 'Failed to mint Cloud Run ID token; skipping dispatch (lock will expire and BullMQ will recover)')
                return
            }
            // No instance extended the lock on failure, so BullMQ's stalled-scan re-queues the job —
            // matching the recovery semantics of a worker that dies mid-job.
            const { error } = await tryCatch(() => httpClient.post(url, job, { headers }))
            if (error) {
                log.error({ error: String(error), job: { id: job.jobId } }, 'Failed to dispatch job to Cloud Run; lock will expire and BullMQ will recover')
                return
            }
            log.debug({ job: { id: job.jobId } }, 'Job dispatched and run by Cloud Run')
        },
    }
}

// Mint a Google-signed OIDC ID token (audience = service URL) so the service runs privately behind IAM
// (roles/run.invoker), which Google verifies at the edge. On GCP the token comes keyless from the metadata
// server; off GCP from a service-account key (GOOGLE_APPLICATION_CREDENTIALS) discovered via ADC.
function buildOidcHeaderResolver({ audience }: { audience: string }): AuthHeaderResolver {
    const auth = new GoogleAuth()
    let clientPromise: Promise<IdTokenClient> | undefined
    return async () => {
        clientPromise ??= auth.getIdTokenClient(audience)
        const client = await clientPromise
        return client.getRequestHeaders()
    }
}

type AuthHeaderResolver = () => Promise<Record<string, string>>

type CloudRunDispatcher = {
    dispatch(params: DispatchParams): Promise<void>
}

type CreateCloudRunDispatcherParams = {
    baseUrl: string
}

type DispatchParams = {
    job: ConsumeJobRequest
    log: ApLogger
}
