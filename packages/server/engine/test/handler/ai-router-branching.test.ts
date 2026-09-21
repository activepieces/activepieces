import { FlowAction, FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildAiRouter, buildPieceAction, generateMockEngineConstants } from './test-helper'

const AI_ROUTER_PATH = '/v1/engine/ai-router'

function mapperStep(name: string): FlowAction {
    return buildPieceAction({
        name,
        pieceName: '@activepieces/piece-data-mapper',
        actionName: 'advanced_mapping',
        input: { mapping: { key: '{{ 1 + 2 }}' } },
    })
}

function answerWith(body: unknown, status = 200) {
    const calls: unknown[] = []
    vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input)
        if (!url.endsWith(AI_ROUTER_PATH)) {
            throw new Error(`unexpected fetch to ${url}`)
        }
        calls.push(JSON.parse(String(init?.body)))
        return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    })
    return calls
}

function execute(action: FlowAction): Promise<FlowExecutorContext> {
    return flowExecutor.execute({
        action,
        executionState: FlowExecutorContext.empty(),
        constants: generateMockEngineConstants(),
    })
}

describe('ai router', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('runs only the route the model chose', async () => {
        answerWith({ choice: 'Billing', probabilities: { Billing: 0.91, Technical: 0.09 } })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }, { branchName: 'Technical', description: 'Bugs' }],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            children: [mapperStep('billing'), mapperStep('technical'), mapperStep('otherwise')],
        }))

        expect(result.verdict).toStrictEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps.billing.output).toEqual({ key: 3 })
        expect(result.steps.technical).toBeUndefined()
        expect(result.steps.otherwise).toBeUndefined()
        expect(result.steps.ai_router.output).toMatchObject({
            choice: 'Billing',
            probabilities: { Billing: 0.91, Technical: 0.09 },
            branches: [
                { branchName: 'Billing', branchIndex: 1, evaluation: true },
                { branchName: 'Technical', branchIndex: 2, evaluation: false },
                { branchName: 'Otherwise', branchIndex: 3, evaluation: false },
            ],
        })
    })

    it('sends every route as a named criterion, fallback included', async () => {
        const calls = answerWith({ choice: 'Otherwise' })

        await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise' },
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(calls[0]).toEqual({
            state: 'My card was charged twice',
            question: 'Which team should handle this?',
            options: {
                Billing: 'Payments',
                Otherwise: 'Anything that fits none of the other routes',
            },
        })
    })

    it('takes the fallback when the answer is below the confidence floor', async () => {
        answerWith({ choice: 'Billing', probabilities: { Billing: 0.4, Otherwise: 0.6 } })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            minConfidence: 0.7,
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.otherwise.output).toEqual({ key: 3 })
        expect(result.steps.ai_router.output).toMatchObject({ choice: 'Otherwise' })
    })

    it('runs no route when the answer is below the floor and there is no fallback', async () => {
        answerWith({ choice: 'Billing', probabilities: { Billing: 0.4 } })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            minConfidence: 0.7,
            children: [mapperStep('billing')],
        }))

        expect(result.verdict).toStrictEqual({ status: FlowRunStatus.RUNNING })
        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.ai_router.output).toMatchObject({
            branches: [{ branchName: 'Billing', branchIndex: 1, evaluation: false }],
        })
    })

    it('ignores the floor when the model returns no probabilities', async () => {
        answerWith({ choice: 'Billing' })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            minConfidence: 0.9,
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(result.steps.billing.output).toEqual({ key: 3 })
        expect(result.steps.otherwise).toBeUndefined()
    })

    it('falls back when the model names a route that does not exist', async () => {
        answerWith({ choice: 'Refunds' })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.otherwise.output).toEqual({ key: 3 })
    })

    it('fails the step when the routing call fails, and takes no route', async () => {
        answerWith({ message: 'boom' }, 500)

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(result.steps.ai_router.status).toBe(StepOutputStatus.FAILED)
        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.otherwise).toBeUndefined()
    })
})
