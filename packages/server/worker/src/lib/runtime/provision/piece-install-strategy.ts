import { type ApLogger } from '@activepieces/server-utils'
import { PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { CodeArtifact } from '../types'
import { provisioner } from '../worker-pool/cache/provisioner'

// LocalCacheInstall is the worker-pool strategy: it runs host-side (NOT inside the locked engine
// sandbox), installing pieces/code into the persistent local cache that is then mounted into the
// sandbox. The serverless BundledTgzInstall strategy (engine self-install from a single .tgz) is
// the engine-side counterpart and ships separately — see [[project_multi_runtime_engine_install]].
export function localCacheInstall({ log, apiClient }: LocalCacheInstallParams): PieceInstallStrategy {
    return {
        install: ({ pieces, codeSteps }) => provisioner(log, apiClient).provision({ pieces, codeSteps }),
    }
}

export type PieceInstallStrategy = {
    install(params: { pieces: PiecePackage[], codeSteps: CodeArtifact[] }): Promise<void>
}

type LocalCacheInstallParams = {
    log: ApLogger
    apiClient: WorkerToApiContract
}
