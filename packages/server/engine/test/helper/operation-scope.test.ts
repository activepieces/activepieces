import { EngineOperation, EngineOperationType, EngineResponseStatus } from '@activepieces/shared'
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

        const response = await execute('UNSUPPORTED' as EngineOperationType, {} as EngineOperation)

        expect(response.status).toBe(EngineResponseStatus.INTERNAL_ERROR)
        expect(disposable.dispose).toHaveBeenCalledTimes(1)
    })
})
