import { isNil, unique } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, WorkerToApiContract } from '@activepieces/shared'
import { flowProvisioning } from './cache/flow/flow-provisioning'
import { CodeArtifact, ProvisionInput, ResolveInput, Resolver, ResolveResult, SandboxSettings } from './types'

// The Resolver is the worker-side, Runtime-Kind-independent half of the seam. It owns the only
// apiClient and turns a job into a fully-materialized ProvisionInput before `execute` is ever called,
// so the pool only sees healthy, complete inputs. Code steps are built from source during provision
// (bun install + index.ts); the bundle carries no code, so publishing needs no build gate.
// fetchArchive is bound to the apiClient and handed to the pool as an opaque thunk — the pool never
// imports WorkerToApiContract.
export function createResolver({ apiClient, basePath, getSettings, log }: CreateResolverParams): Resolver {
    return {
        async resolve(input: ResolveInput): Promise<ResolveResult> {
            let pieces = input.pieces ?? []
            let codes: CodeArtifact[] = input.codes ?? []
            let flowVersion: FlowVersion | undefined

            if (!isNil(input.flow)) {
                const resolved = await flowProvisioning(log, apiClient, basePath, getSettings).resolve({ flow: input.flow, platformId: input.platformId })
                if (resolved.kind === 'flow-not-found') {
                    return { kind: 'flow-not-found' }
                }
                if (resolved.kind === 'disabled') {
                    return { kind: 'disabled', failedStep: resolved.failedStep }
                }
                flowVersion = resolved.flowVersion
                pieces = [...pieces, ...resolved.pieces]
                codes = [...codes, ...resolved.codeSteps]
                if (!isNil(resolved.publishBundle)) {
                    void resolved.publishBundle()
                }
            }

            const uniquePieces = unique(pieces)

            const provision: ProvisionInput = {
                platformId: input.platformId,
                flowVersionId: flowVersion?.id,
                pieces: uniquePieces,
                codes,
                publicApiUrl: input.publicApiUrl,
                engineToken: input.engineToken,
            }
            return { kind: 'ready', provision, flowVersion }
        },
    }
}

type CreateResolverParams = {
    apiClient: WorkerToApiContract
    basePath: string
    getSettings: () => SandboxSettings
    log: ApLogger
}
