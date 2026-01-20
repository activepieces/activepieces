import { EngineOperationType, EngineResponseStatus, ExecuteToolOperation, ExecuteToolResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { executionFiles } from '../../cache/execution-files'
import { pieceWorkerCache } from '../../cache/piece-worker-cache'
import { workerMachine } from '../../utils/machine'
import { Sandbox } from '../../compute/sandbox/sandbox'
import { sandboxPool } from '../../compute/sandbox/sandbox-pool'

type ExecuteToolOperationInput = Omit<ExecuteToolOperation, 'publicApiUrl' | 'internalApiUrl' | 'engineToken'> & {
    modelId: string
}

export const pieceExecutor = (log: FastifyBaseLogger) => ({
    async executeTool(
        engineToken: string,
        operation: ExecuteToolOperationInput,
    ): Promise<ExecuteToolResponse> {
        const piece = await pieceWorkerCache(log).getPiece({
            engineToken,
            pieceName: operation.pieceName,
            pieceVersion: operation.pieceVersion,
            platformId: operation.platformId,
        })

        await executionFiles(log).provision({
            pieces: [piece],
            codeSteps: [],
        })

        const input: ExecuteToolOperation = {
            ...operation,
            publicApiUrl: workerMachine.getPublicApiUrl(),
            internalApiUrl: workerMachine.getInternalApiUrl(),
            engineToken,
        }

        let sandbox: Sandbox | undefined
        try {
            sandbox = sandboxPool.allocate(log)
            await sandbox.start({ flowVersionId: undefined, platformId: operation.platformId })

            const { engine } = await sandbox.execute(EngineOperationType.EXECUTE_TOOL, input, {
                timeoutInSeconds: operation.timeoutInSeconds,
            })

            if (engine.status !== EngineResponseStatus.OK) {
                throw new Error(`Tool execution failed with status: ${engine.status}`)
            }

            return engine.response as ExecuteToolResponse
        }
        finally {
            await sandboxPool.release(sandbox)
        }
    },
})

