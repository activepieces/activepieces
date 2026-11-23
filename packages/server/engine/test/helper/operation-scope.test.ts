import { EngineOperationType, EngineResponseStatus, ExecuteExtractPieceMetadataOperation, PackageType, PieceType } from '@activepieces/shared'
import { operationScope } from '../../src/lib/helper/operation-scope'
import { execute } from '../../src/lib/operations'

describe('operationScope', () => {
    it('disposes every tracked disposable once, even when one of them fails', async () => {
        const failing = { dispose: vi.fn().mockRejectedValue(new Error('dispose failed')) }
        const healthy = { dispose: vi.fn().mockResolvedValue(undefined) }
        operationScope.track(failing)
        operationScope.track(healthy)

        await operationScope.disposeAll()
        await operationScope.disposeAll()

        expect(failing.dispose).toHaveBeenCalledTimes(1)
        expect(healthy.dispose).toHaveBeenCalledTimes(1)
    })

    it('is emptied at the end of an operation, including one that fails', async () => {
        const disposable = { dispose: vi.fn().mockResolvedValue(undefined) }
        operationScope.track(disposable)

        const missingPiece: ExecuteExtractPieceMetadataOperation = {
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: '@activepieces/piece-that-does-not-exist',
            pieceVersion: '0.0.1',
            platformId: 'platformId',
            timeoutInSeconds: 10,
        }

        const response = await execute(EngineOperationType.EXTRACT_PIECE_METADATA, missingPiece)

        expect(response.status).toBe(EngineResponseStatus.INTERNAL_ERROR)
        expect(disposable.dispose).toHaveBeenCalledTimes(1)
    })
})
