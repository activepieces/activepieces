import { type ApLogger } from '@activepieces/server-utils'
import { isNil, WorkerToApiContract } from '@activepieces/shared'

// The worker never talks to the cloud provider directly. The API server owns the Redis
// fast-lookup, the distributed lock and the actual deploy (see
// api/.../function-provisioning/function-provisioning.service.ts). The worker keeps only a
// process-lifetime cache so repeat jobs for the same project skip even the RPC round-trip.
export const functionProvisioner = {
    create(): FunctionProvisioner {
        const cache = new Map<string, ProvisionedFunction>()
        const inflight = new Map<string, Promise<ProvisionedFunction>>()
        return {
            async ensure({ projectId, log, apiClient }: EnsureParams): Promise<ProvisionedFunction> {
                const cached = cache.get(projectId)
                if (!isNil(cached)) {
                    log.debug({ projectId }, 'Function already provisioned (worker cache hit), skipping')
                    return cached
                }
                const existing = inflight.get(projectId)
                if (!isNil(existing)) {
                    return existing
                }
                const promise = apiClient.ensureFunction({ projectId })
                    .then((result) => {
                        cache.set(projectId, result)
                        return result
                    })
                    .finally(() => inflight.delete(projectId))
                inflight.set(projectId, promise)
                return promise
            },
        }
    },
}

export type ProvisionedFunction = {
    url: string
    engineToken: string
}

export type FunctionProvisioner = {
    ensure(params: EnsureParams): Promise<ProvisionedFunction>
}

type EnsureParams = {
    projectId: string
    log: ApLogger
    apiClient: WorkerToApiContract
}
