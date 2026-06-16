import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { zstdDecompress as zstdDecompressCb } from 'node:zlib'
import {
    EngineOperationType,
    EngineResponseStatus,
    ExecutionType,
    FlowActionType,
    FlowTriggerType,
    FlowVersionState,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { createCloudFunctionRuntime } from '../../../packages/server/worker/src/lib/execute/runtime/cloud-function/cloud-function-runtime'

const zstdDecompress = promisify(zstdDecompressCb)

const CODES_DIR = process.env.AP_BASE_CODE_DIRECTORY ?? '/codes'
const MOCK_API = process.env.MOCK_API_URL ?? 'http://mock-api:3000'
const ENGINE_URL = process.env.ENGINE_URL ?? 'http://engine:8080'
const ENGINE_TOKEN = process.env.ENGINE_TOKEN ?? 'smoke-shared-engine-token'
const PROJECT_ID = 'smokeproject1'
const FLOW_VERSION_ID = 'fvsmoke1'
const STEP_NAME = 'step_1'
const LOGS_FILE_ID = 'logs-smoke-1'

const log = makeConsoleLogger()
// Stubs the control-plane RPC the worker uses in production (apiClient.ensureFunction), pointed
// at the local engine container instead of a real GCP deploy.
const apiClient = { ensureFunction: async () => ({ url: ENGINE_URL, engineToken: ENGINE_TOKEN }) } as never

async function main(): Promise<void> {
    writeCodeArtifact()

    const flowVersion = buildFlowVersion()
    const runtime = createCloudFunctionRuntime({ slot: 0 })

    // First ready() provisions the project's function; second ready() must hit the
    // "already provisioned, skipping" path — that is the cheap, idempotent provisioning the
    // runtime promises.
    const operation = buildOperation(flowVersion)
    const sandbox = await runtime.ready({ operation: readyOperation(flowVersion), log, apiClient })
    await runtime.ready({ operation: readyOperation(flowVersion), log, apiClient })

    console.log('[smoke] executing flow on remote function...')
    const startedAt = Date.now()
    const result = await sandbox.execute(EngineOperationType.EXECUTE_FLOW, operation, { timeoutInSeconds: 30 })
    const elapsedMs = Date.now() - startedAt
    console.log(`[smoke] engine responded status=${result.status} in ${elapsedMs}ms`)

    if (result.status !== EngineResponseStatus.OK) {
        throw new Error(`Expected OK engine response, got ${result.status}: ${result.error ?? ''}`)
    }

    const stepOutput = await readCodeStepOutputFromLogs()
    console.log('[smoke] code step output:', JSON.stringify(stepOutput))
    if (!stepOutput || stepOutput.sum !== 5 || stepOutput.product !== 6) {
        throw new Error(`Unexpected code step output: ${JSON.stringify(stepOutput)}`)
    }

    await runtime.shutdown(log)
    console.log('\n✅ SMOKE TEST PASSED — flow executed end-to-end on the remote engine function via the CLOUD_FUNCTION runtime')
}

function writeCodeArtifact(): void {
    const dir = path.join(CODES_DIR, FLOW_VERSION_ID, STEP_NAME)
    mkdirSync(dir, { recursive: true })
    const code = `exports.code = async (inputs) => ({ sum: inputs.a + inputs.b, product: inputs.a * inputs.b })\n`
    writeFileSync(path.join(dir, 'index.js'), code)
    console.log(`[smoke] wrote code artifact to ${path.join(dir, 'index.js')}`)
}

function buildFlowVersion(): never {
    const codeStep = {
        name: STEP_NAME,
        displayName: 'Add two numbers',
        type: FlowActionType.CODE,
        skip: false,
        valid: true,
        settings: {
            input: { a: 2, b: 3 },
            sourceCode: { code: '', packageJson: '{}' },
            errorHandlingOptions: {
                continueOnFailure: { value: false },
                retryOnFailure: { value: false },
            },
        },
    }
    return {
        id: FLOW_VERSION_ID,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-smoke-1',
        displayName: 'Smoke Flow',
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'Manual Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            nextAction: codeStep,
        },
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    } as never
}

function readyOperation(flowVersion: never): never {
    return { kind: 'FLOW', flowVersion, platformId: 'platsmoke1', flowId: 'flow-smoke-1', projectId: PROJECT_ID } as never
}

function buildOperation(flowVersion: never): never {
    return {
        projectId: PROJECT_ID,
        engineToken: 'engine-callback-token',
        internalApiUrl: `${MOCK_API}/`,
        publicApiUrl: `${MOCK_API}/api/`,
        timeoutInSeconds: 30,
        platformId: 'platsmoke1',
        flowVersion,
        flowRunId: 'run-smoke-1',
        executionType: ExecutionType.BEGIN,
        runEnvironment: RunEnvironment.PRODUCTION,
        workerHandlerId: null,
        httpRequestId: null,
        streamStepProgress: StreamStepProgress.NONE,
        stepNameToTest: null,
        logsFileId: LOGS_FILE_ID,
        triggerPayload: { type: 'inline', value: {} },
        executeTrigger: false,
    } as never
}

async function readCodeStepOutputFromLogs(): Promise<{ sum?: number, product?: number } | null> {
    const capturedRes = await fetch(`${MOCK_API}/__captured`)
    const captured = await capturedRes.json() as { fileIds: string[], callbacks: { name: string }[] }
    console.log('[smoke] mock-api captured callbacks:', captured.callbacks.map((c) => c.name).join(', '))
    if (!captured.fileIds.includes(LOGS_FILE_ID)) {
        throw new Error(`Engine never uploaded the run-log file (${LOGS_FILE_ID})`)
    }
    const fileRes = await fetch(`${MOCK_API}/v1/files/${LOGS_FILE_ID}`)
    const compressed = Buffer.from(await fileRes.arrayBuffer())
    const decompressed = await zstdDecompress(compressed)
    const parsed = JSON.parse(decompressed.toString('utf-8')) as { executionState?: { steps?: Record<string, { output?: unknown }> } }
    const step = parsed.executionState?.steps?.[STEP_NAME]
    return (step?.output ?? null) as { sum?: number, product?: number } | null
}

function makeConsoleLogger(): never {
    const fn = (obj: unknown, msg?: string) => console.log('[runtime]', msg ?? '', JSON.stringify(obj))
    return { info: fn, debug: fn, error: fn, warn: fn, trace: fn, fatal: fn, child: () => makeConsoleLogger() } as never
}

main().catch((err) => {
    console.error('\n❌ SMOKE TEST FAILED:', err)
    process.exit(1)
})
