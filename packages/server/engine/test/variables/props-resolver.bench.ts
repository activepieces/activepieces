import { bench, describe } from 'vitest'

process.env.AP_EXECUTION_MODE = 'SANDBOX_CODE_ONLY'

const { FlowActionType, GenericStepOutput, StepOutputStatus } = await import('@activepieces/shared')
const { LATEST_CONTEXT_VERSION } = await import('@activepieces/pieces-framework')
const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')

const bigOutput = {
    field: 'small-value',
    num: 41,
    rows: Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `row-${i}`, payload: 'x'.repeat(1000) })),
}

const executionState = await FlowExecutorContext.empty().upsertStep('step_1', GenericStepOutput.create({
    type: FlowActionType.PIECE,
    status: StepOutputStatus.SUCCEEDED,
    input: {},
    output: bigOutput,
}))

const resolver = createPropsResolver({
    engineToken: 'TOKEN',
    projectId: 'PROJECT_ID',
    apiUrl: 'http://127.0.0.1:3000',
    contextVersion: LATEST_CONTEXT_VERSION,
    stepNames: ['step_1'],
})

const manyPathTokens = Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [`key_${i}`, `{{step_1.output.rows[${i}].name}}`]),
)

describe(`props resolution against a ~${Math.round(Buffer.byteLength(JSON.stringify(bigOutput)) / 1024 / 1024)} MB step output`, () => {
    bench('single path token', async () => {
        await resolver.resolve({ unresolvedInput: '{{step_1.output.field}}', executionState })
    })

    bench('object input with 10 path tokens', async () => {
        await resolver.resolve({ unresolvedInput: manyPathTokens, executionState })
    })

    bench('single expression token', async () => {
        await resolver.resolve({ unresolvedInput: '{{step_1.output.num + 1}}', executionState })
    })

    bench('whole big output referenced', async () => {
        await resolver.resolve({ unresolvedInput: '{{step_1.output}}', executionState })
    })
})
