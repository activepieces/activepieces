import { AI_ROUTER_MAX_STATE_LENGTH, AiRouterMatchMode, FlowAction, FlowRunStatus, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { StepExecutionPath } from '../../src/lib/handler/context/step-execution-path'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildAiRouter, buildPieceAction, generateMockEngineConstants } from './test-helper'

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: async () => ({ id: 'mock-waitpoint-id', resumeUrl: 'http://localhost/resume' }),
    },
}))

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
        constants: generateMockEngineConstants({ actionRunMode: true }),
    })
}

function executeInFlow(action: FlowAction, executionState = FlowExecutorContext.empty(), resumePayload?: { body: unknown }): Promise<FlowExecutorContext> {
    return flowExecutor.execute({
        action,
        executionState,
        constants: generateMockEngineConstants(resumePayload ? { resumePayload: { ...resumePayload, headers: {}, queryParams: {} } } : {}),
    })
}

function resumedFrom(paused: FlowExecutorContext): FlowExecutorContext {
    return paused.setCurrentPath(StepExecutionPath.empty()).setVerdict({ status: FlowRunStatus.RUNNING })
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
            flowId: 'flowId',
            flowRunId: 'flowRunId',
        })
    })

    it('sends at most the first 20,000 characters of the input', async () => {
        const calls = answerWith({ matched: ['Billing'] })

        await execute(buildAiRouter({
            text: 'x'.repeat(AI_ROUTER_MAX_STATE_LENGTH + 5_000),
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            children: [mapperStep('billing')],
        }))

        expect(calls[0]).toMatchObject({ state: 'x'.repeat(AI_ROUTER_MAX_STATE_LENGTH) })
    })

    it('never cuts the input through the middle of an emoji', async () => {
        const calls = answerWith({ matched: ['Billing'] })

        await execute(buildAiRouter({
            text: 'x'.repeat(AI_ROUTER_MAX_STATE_LENGTH - 1) + '😀',
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            children: [mapperStep('billing')],
        }))

        expect(calls[0]).toMatchObject({ state: 'x'.repeat(AI_ROUTER_MAX_STATE_LENGTH - 1) })
    })

    it('fails the step with the credits message when the API refuses for lack of credits', async () => {
        answerWith({ code: 'QUOTA_EXCEEDED', params: { metric: 'credits', message: 'The AI Router did not run because the platform is out of AI credits.' } }, 402)

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise' },
            children: [mapperStep('billing'), mapperStep('otherwise')],
        }))

        expect(result.steps.ai_router.status).toBe(StepOutputStatus.FAILED)
        expect(result.steps.ai_router.errorMessage).toContain('out of AI credits')
        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.otherwise).toBeUndefined()
    })

    it('runs the fallback without asking the model when every-route mode has no route to ask about', async () => {
        const calls = answerWith({ matched: [] })

        const result = await execute(buildAiRouter({
            matchMode: AiRouterMatchMode.ALL_MATCHES,
            routes: [],
            fallback: { branchName: 'Otherwise', description: 'Anything else' },
            children: [mapperStep('otherwise')],
        }))

        expect(calls).toHaveLength(0)
        expect(result.steps.otherwise.output).toEqual({ key: 3 })
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

    it('records no choice when the model names a route that does not exist and there is no fallback', async () => {
        answerWith({ matched: ['Refunds'] })

        const result = await execute(buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            children: [mapperStep('billing')],
        }))

        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.ai_router.output).not.toHaveProperty('choice')
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
                flowId: 'flowId',
                flowRunId: 'flowRunId',
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

        it('lets a floor under 50% keep a route the worker left out', async () => {
            answerWith({ matched: [], probabilities: { Billing: 0.4, Sales: 0.2 } })

            const result = await execute(buildAiRouter({
                matchMode: allMatches,
                minConfidence: 0.3,
                routes: [{ branchName: 'Billing', description: 'Payments' }, { branchName: 'Sales', description: 'Pricing' }],
                fallback: { branchName: 'Otherwise', description: 'Anything else' },
                children: [mapperStep('billing'), mapperStep('sales'), mapperStep('otherwise')],
            }))

            expect(result.steps.billing.output).toEqual({ key: 3 })
            expect(result.steps.sales).toBeUndefined()
            expect(result.steps.otherwise).toBeUndefined()
        })
    })
})

describe('ai router pauses the run while the worker decides', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    const billingFlow = () => buildAiRouter({
        routes: [{ branchName: 'Billing', description: 'Payments' }],
        fallback: { branchName: 'Otherwise' },
        children: [mapperStep('billing'), mapperStep('otherwise')],
    })

    const answerFor = (route: string) => ({ body: { output: { matched: [route], probabilities: { Billing: 0.9, Otherwise: 0.1 } } } })

    it('creates a waitpoint, starts the decision, and pauses without running a route', async () => {
        const calls = answerWith({ requestId: 'req-1' }, 202)

        const result = await executeInFlow(billingFlow())

        expect(result.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(result.steps.ai_router.status).toBe(StepOutputStatus.PAUSED)
        expect(calls[0]).toMatchObject({ waitpointId: 'mock-waitpoint-id', flowId: 'flowId', flowRunId: 'flowRunId' })
        expect(result.steps.billing).toBeUndefined()
        expect(result.steps.otherwise).toBeUndefined()
    })

    it('resumes with the worker answer, runs that route, and asks nothing a second time', async () => {
        const calls = answerWith({ requestId: 'req-1' }, 202)
        const flow = billingFlow()
        const paused = await executeInFlow(flow)

        const resumed = await executeInFlow(flow, resumedFrom(paused), answerFor('Billing'))

        expect(calls).toHaveLength(1)
        expect(resumed.steps.ai_router).toMatchObject({ status: StepOutputStatus.SUCCEEDED, output: { choice: 'Billing' } })
        expect(resumed.steps.billing.output).toEqual({ key: 3 })
        expect(resumed.steps.otherwise).toBeUndefined()
    })

    it('fails the step with the worker failure text when the answer is a failure', async () => {
        answerWith({ requestId: 'req-1' }, 202)
        const flow = billingFlow()
        const paused = await executeInFlow(flow)

        const resumed = await executeInFlow(flow, resumedFrom(paused), { body: { failure: 'The routing model did not answer: HTTP 402: Insufficient credits' } })

        expect(resumed.steps.ai_router.status).toBe(StepOutputStatus.FAILED)
        expect(resumed.steps.ai_router.errorMessage).toContain('Insufficient credits')
        expect(resumed.steps.billing).toBeUndefined()
    })

    it('fails the step when the deadline resumes it with no answer at all', async () => {
        answerWith({ requestId: 'req-1' }, 202)
        const flow = billingFlow()
        const paused = await executeInFlow(flow)

        const resumed = await executeInFlow(flow, resumedFrom(paused), { body: {} })

        expect(resumed.steps.ai_router.status).toBe(StepOutputStatus.FAILED)
        expect(resumed.steps.ai_router.errorMessage).toContain('did not answer before the step timed out')
    })

    it('reuses the decision when a step inside the chosen route pauses and resumes later', async () => {
        const calls = answerWith({ requestId: 'req-1' }, 202)
        const flow = buildAiRouter({
            routes: [{ branchName: 'Billing', description: 'Payments' }],
            fallback: { branchName: 'Otherwise' },
            children: [
                buildPieceAction({
                    name: 'approval',
                    pieceName: '@activepieces/piece-approval',
                    actionName: 'wait_for_approval',
                    input: {},
                    nextAction: mapperStep('billing'),
                }),
                mapperStep('otherwise'),
            ],
        })

        const pausedOnRouter = await executeInFlow(flow)
        const pausedOnApproval = await executeInFlow(flow, resumedFrom(pausedOnRouter), answerFor('Billing'))
        expect(pausedOnApproval.verdict).toEqual({ status: FlowRunStatus.PAUSED })
        expect(pausedOnApproval.steps.approval.status).toBe(StepOutputStatus.PAUSED)

        const finished = await flowExecutor.execute({
            action: flow,
            executionState: resumedFrom(pausedOnApproval),
            constants: generateMockEngineConstants({ resumePayload: { body: {}, headers: {}, queryParams: { action: 'approve' } } }),
        })

        expect(calls).toHaveLength(1)
        expect(finished.steps.ai_router).toMatchObject({ status: StepOutputStatus.SUCCEEDED, output: { choice: 'Billing' } })
        expect(finished.steps.approval.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(finished.steps.billing.output).toEqual({ key: 3 })
    })
})
