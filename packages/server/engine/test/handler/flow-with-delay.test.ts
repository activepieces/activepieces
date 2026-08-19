import { FlowRunStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { EngineApiStub, startEngineApiStub } from '../helpers/engine-api-stub'
import { buildCodeAction, buildPieceAction, generateMockEngineConstants } from './test-helper'

const WAITPOINT_PATH = '/v1/waitpoints'

describe('flow with delay', () => {
    let engineApi: EngineApiStub

    beforeEach(async () => {
        engineApi = await startEngineApiStub({
            [`POST ${WAITPOINT_PATH}`]: { id: 'mock-waitpoint-id', resumeUrl: 'http://localhost/resume' },
        })
    })

    afterEach(async () => {
        await engineApi.close()
    })

    it('delay-for pauses flow and calls waitpointClient.create with DELAY type', async () => {
        const delayForFlow = buildPieceAction({
            name: 'delay_step',
            pieceName: '@activepieces/piece-delay',
            actionName: 'delayFor',
            input: {
                unit: 'seconds',
                delayFor: 60,
            },
            nextAction: buildCodeAction({
                name: 'echo_step',
                input: {},
            }),
        })

        const result = await flowExecutor.execute({
            action: delayForFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ internalApiUrl: engineApi.url }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })
        expect(engineApi.requestsFor(WAITPOINT_PATH)[0].body).toEqual(
            expect.objectContaining({
                type: 'DELAY',
                resumeDateTime: expect.any(String),
            }),
        )
    })

    it('delay-for resumes successfully after pause', async () => {
        const delayForFlow = buildPieceAction({
            name: 'delay_step',
            pieceName: '@activepieces/piece-delay',
            actionName: 'delayFor',
            input: {
                unit: 'seconds',
                delayFor: 60,
            },
            nextAction: buildCodeAction({
                name: 'echo_step',
                input: {},
            }),
        })

        const pauseResult = await flowExecutor.execute({
            action: delayForFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ internalApiUrl: engineApi.url }),
        })

        const resumeResult = await flowExecutor.execute({
            action: delayForFlow,
            executionState: pauseResult.setVerdict({
                status: FlowRunStatus.RUNNING,
            }),
            constants: generateMockEngineConstants({
                internalApiUrl: engineApi.url,
                resumePayload: {
                    queryParams: {},
                    body: {},
                    headers: {},
                },
            }),
        })

        expect(resumeResult.verdict).toEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(resumeResult.steps.delay_step.output).toEqual(
            expect.objectContaining({ success: true }),
        )
    })

    it('delay-for uses setTimeout for short delays without pausing', async () => {
        const shortDelayFlow = buildPieceAction({
            name: 'delay_step',
            pieceName: '@activepieces/piece-delay',
            actionName: 'delayFor',
            input: {
                unit: 'seconds',
                delayFor: 1,
            },
        })

        const result = await flowExecutor.execute({
            action: shortDelayFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ internalApiUrl: engineApi.url }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(engineApi.requestsFor(WAITPOINT_PATH)).toHaveLength(0)
    })

    it('delay-until pauses flow for future dates', async () => {
        const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        const delayUntilFlow = buildPieceAction({
            name: 'delay_step',
            pieceName: '@activepieces/piece-delay',
            actionName: 'delay_until',
            input: {
                delayUntilTimestamp: futureDate,
            },
            nextAction: buildCodeAction({
                name: 'echo_step',
                input: {},
            }),
        })

        const result = await flowExecutor.execute({
            action: delayUntilFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ internalApiUrl: engineApi.url }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })
        expect(engineApi.requestsFor(WAITPOINT_PATH)[0].body).toEqual(
            expect.objectContaining({
                type: 'DELAY',
                resumeDateTime: expect.any(String),
            }),
        )
    })

    it('delay-until completes immediately for past dates', async () => {
        const pastDate = new Date(Date.now() - 60 * 1000).toISOString()
        const delayUntilFlow = buildPieceAction({
            name: 'delay_step',
            pieceName: '@activepieces/piece-delay',
            actionName: 'delay_until',
            input: {
                delayUntilTimestamp: pastDate,
            },
        })

        const result = await flowExecutor.execute({
            action: delayUntilFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ internalApiUrl: engineApi.url }),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(engineApi.requestsFor(WAITPOINT_PATH)).toHaveLength(0)
    })
})
