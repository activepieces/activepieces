import { argv } from 'process'
import { parentPort } from 'worker_threads'
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

async function executeFromWorkerData(operation: EngineOperation, operationType: EngineOperationType): Promise<void> {
    const result = await execute(operationType, operation)
    assertNotNullOrUndefined(parentPort, 'parentPort')
    const resultParsed = JSON.parse(JSON.stringify(result))
    parentPort.postMessage({ type: 'result', message: resultParsed })
}

const operationType = argv[2]

if (operationType) {
    executeFromFile(operationType).catch(e => console.error(e))
}
else {
    if (parentPort) {
        const originalLog = console.log
        console.log = function (...args) {
            assertNotNullOrUndefined(parentPort, 'parentPort')
            parentPort.postMessage({ type: 'stdout', message: args.join(' ') })
            originalLog.apply(console, args)
        }

        const originalError = console.error
        console.error = function (...args) {
            assertNotNullOrUndefined(parentPort, 'parentPort')
            parentPort.postMessage({ type: 'stderr', message: args.join(' ') })
            originalError.apply(console, args)
        }
        parentPort.on('message', (m: { operation: EngineOperation, operationType: EngineOperationType }) => {
            executeFromWorkerData(m.operation, m.operationType).catch(e => console.error(e))
        })
    }
}
