import { FlowRunStatus } from '@activepieces/shared'
import { vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { waitpointClient } from '../../src/lib/piece-context/waitpoint-client'
import { buildCodeAction, buildPieceAction, generateMockEngineConstants } from './test-helper'

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: {
        create: vi.fn().mockResolvedValue({ id: 'mock-waitpoint-id', resumeUrl: 'http://localhost/resume' }),
    },
}))

describe('flow with delay', () => {

    beforeEach(() => {
        vi.clearAllMocks()
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
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })
        expect(waitpointClient.create).toHaveBeenCalledWith(
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
            constants: generateMockEngineConstants(),
        })

        const resumeResult = await flowExecutor.execute({
            action: delayForFlow,
            executionState: pauseResult.setVerdict({
                status: FlowRunStatus.RUNNING,
            }),
            constants: generateMockEngineConstants({
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
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(waitpointClient.create).not.toHaveBeenCalled()
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
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
        })
        expect(waitpointClient.create).toHaveBeenCalledWith(
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
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(waitpointClient.create).not.toHaveBeenCalled()
    })
})
