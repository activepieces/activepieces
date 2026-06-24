import { type ApLogger } from '@activepieces/server-utils'
import { PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { pieceInstaller } from './cache/pieces/piece-installer'
import { SandboxPoolSettings } from './types'

export async function warmupPieces({ pieces, basePath, getSettings, log, apiClient }: WarmupPiecesParams): Promise<void> {
    await pieceInstaller(log, apiClient, basePath, getSettings).install({ pieces, includeFilters: true })
}

type WarmupPiecesParams = {
    pieces: PiecePackage[]
    basePath: string
    getSettings: () => SandboxPoolSettings
    log: ApLogger
    apiClient: WorkerToApiContract
}
