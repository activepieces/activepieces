import { ApEnvironment } from '@activepieces/shared'
import { workerMachine } from '../../../utils/machine'

/**
 * Tracks the current "generation" of dev pieces.
 * Incremented after each successful rebuild so workers know when to restart.
 */
let pieceGeneration = 0

export const devPiecesState = {
    getGeneration(): number {
        return pieceGeneration
    },
    incrementGeneration(): number {
        return ++pieceGeneration
    },
    isWorkerGenerationStale(workerGeneration: number): boolean {
        const isDev = workerMachine.getSettings().ENVIRONMENT === ApEnvironment.DEVELOPMENT
        return isDev && workerGeneration !== pieceGeneration
    },
}
