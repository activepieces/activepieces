import { AiRouterMatchMode, FlowAction, FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
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
        answerWith({ matched: ['Billing'], probabilities: { Billing: 0.91, Technical: 0.09 } })

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
        const calls = answerWith({ matched: ['Otherwise'] })

        await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise' },
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(calls[0]).toEqual({
            state: 'My card was charged twice',
            question: 'Which team should handle this?',
            matchMode: AiRouterMatchMode.BEST_MATCH,
            options: {
                Billing: 'Payments',
                Otherwise: 'Anything that fits none of the other routes',
            },
        })
    })

    it('sends a route named after an inherited object property', async () => {
        const calls = answerWith({ matched: ['constructor'] })

        await execute(buildAiRouter({
            routes: [{ branchName: 'constructor', description: 'Building work' }, { branchName: 'toString', description: 'Text' }],
            fallback: { branchName: 'Otherwise' },
            children: [mapperStep('constructor_route'), mapperStep('to_string'), mapperStep('otherwise')],
        }))

        expect(calls[0]).toMatchObject({
            options: { constructor: 'Building work', toString: 'Text' },
        })
    })

    it('takes the fallback when the answer is below the confidence floor', async () => {
        answerWith({ matched: ['Billing'], probabilities: { Billing: 0.4, Otherwise: 0.6 } })

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
        answerWith({ matched: ['Billing'], probabilities: { Billing: 0.4 } })

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
        answerWith({ matched: ['Billing'] })

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
        answerWith({ matched: ['Refunds'] })

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

    describe('taking every route that applies', () => {
        const allMatches = AiRouterMatchMode.ALL_MATCHES

        it('runs every route the model affirmed', async () => {
            answerWith({ matched: ['Billing', 'Sales'], probabilities: { Billing: 0.9, Sales: 0.7, Technical: 0.05 } })

            const result = await execute(buildAiRouter({
                matchMode: allMatches,
                routes: [{ branchName: 'Billing', description: 'Payments' }, { branchName: 'Technical', description: 'Bugs' }, { branchName: 'Sales', description: 'Pricing' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('technical'), mapperStep('sales'), mapperStep('otherwise')],
            }))

            expect(result.steps.billing.output).toEqual({ key: 3 })
            expect(result.steps.sales.output).toEqual({ key: 3 })
            expect(result.steps.technical).toBeUndefined()
            expect(result.steps.otherwise).toBeUndefined()
            expect(result.steps.ai_router.output).not.toHaveProperty('choice')
        })

        it('never asks about the fallback route', async () => {
            const calls = answerWith({ matched: ['Billing'] })

            await execute(buildAiRouter({
                matchMode: allMatches,
                routes: [{ branchName: 'Billing', description: 'Payments' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('otherwise')],
            }))

            expect(calls[0]).toEqual({
                state: 'My card was charged twice',
                question: 'Which team should handle this?',
                matchMode: allMatches,
                options: { Billing: 'Payments' },
            })
        })

        it('runs the fallback only when nothing matched', async () => {
            answerWith({ matched: [] })

            const result = await execute(buildAiRouter({
                matchMode: allMatches,
                routes: [{ branchName: 'Billing', description: 'Payments' }, { branchName: 'Sales', description: 'Pricing' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('sales'), mapperStep('otherwise')],
            }))

            expect(result.steps.billing).toBeUndefined()
            expect(result.steps.sales).toBeUndefined()
            expect(result.steps.otherwise.output).toEqual({ key: 3 })
        })

        it('drops individual routes that fall below the floor', async () => {
            answerWith({ matched: ['Billing', 'Sales'], probabilities: { Billing: 0.95, Sales: 0.4 } })

            const result = await execute(buildAiRouter({
                matchMode: allMatches,
                minConfidence: 0.7,
                routes: [{ branchName: 'Billing', description: 'Payments' }, { branchName: 'Sales', description: 'Pricing' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('sales'), mapperStep('otherwise')],
            }))

            expect(result.steps.billing.output).toEqual({ key: 3 })
            expect(result.steps.sales).toBeUndefined()
            expect(result.steps.otherwise).toBeUndefined()
        })

        it('runs the fallback when the floor rejects every route', async () => {
            answerWith({ matched: ['Billing'], probabilities: { Billing: 0.4 } })

            const result = await execute(buildAiRouter({
                matchMode: allMatches,
                minConfidence: 0.7,
                routes: [{ branchName: 'Billing', description: 'Payments' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('otherwise')],
            }))

            expect(result.steps.billing).toBeUndefined()
            expect(result.steps.otherwise.output).toEqual({ key: 3 })
        })
    })
})
