import { argv } from 'process'
import { parentPort, workerData } from 'worker_threads'
import {
    assertNotNullOrUndefined,
    EngineOperation,
    EngineOperationType,
} from '@activepieces/shared'
import { EngineConstants } from './lib/handler/context/engine-constants'
import { execute } from './lib/operations'
import { utils } from './lib/utils'

async function executeFromFile(operationType: string): Promise<void> {
    const input: EngineOperation = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
    const operationTypeCasted = operationType as EngineOperationType
    const result = await execute(operationTypeCasted, input)
    await utils.writeToJsonFile(EngineConstants.OUTPUT_FILE, result)
}

async function executeFromWorkerData(): Promise<void> {
    const { operation, operationType } = workerData
    const result = await execute(operationType, operation)
    assertNotNullOrUndefined(parentPort, 'parentPort')
    parentPort.postMessage({
        type: 'result',
        message: result,
    })
}

const operationType = argv[2]

if (operationType) {
    executeFromFile(operationType).catch(e => console.error(e))
}
else {
    if (workerData) {
        const originalLog = console.log
        console.log = function (...args) {
            parentPort.postMessage({ type: 'stdout', message: args.join(' ') })
            originalLog.apply(console, args)
        }


        const originalError = console.error
        console.error = function (...args) {
            parentPort.postMessage({ type: 'stderr', message: args.join(' ') })
            originalError.apply(console, args)
        }

        executeFromWorkerData().catch(e => console.error(e))

    }
}
