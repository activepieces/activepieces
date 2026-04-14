import { FlowRunStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildPieceAction, generateMockEngineConstants } from './test-helper'

describe('memory stability', () => {

    it('should not leak memory after many flow executions with code and data mapper', async () => {
        const warmupIterations = 10
        const testIterations = 500

        const flow = {
            ...buildCodeAction({
                name: 'echo_step',
                input: {
                    total: '{{ (100 + 15) * 3 }}',
                    greeting: '{{ "hello" + " " + "world" }}',
                },
            }),
            nextAction: {
                ...buildPieceAction({
                    name: 'data_mapper',
                    pieceName: '@activepieces/piece-data-mapper',
                    actionName: 'advanced_mapping',
                    input: {
                        mapping: {
                            price: '{{ 100 + 15 }}',
                            label: '{{ "item-" + "abc" }}',
                        },
                    },
                }),
            },
        }

        // Warmup — let the persistent isolate initialize and stabilize
        for (let i = 0; i < warmupIterations; i++) {
            await flowExecutor.execute({
                action: flow,
                executionState: FlowExecutorContext.empty(),
                constants: generateMockEngineConstants(),
            })
        }

        global.gc?.()
        const baselineRss = process.memoryUsage().rss

        for (let i = 0; i < testIterations; i++) {
            const result = await flowExecutor.execute({
                action: flow,
                executionState: FlowExecutorContext.empty(),
                constants: generateMockEngineConstants(),
            })
            expect(result.verdict.status).toBe(FlowRunStatus.RUNNING)
        }

        global.gc?.()
        const finalRss = process.memoryUsage().rss
        const growthMb = (finalRss - baselineRss) / (1024 * 1024)

        expect(growthMb).toBeLessThan(50)
    }, 120_000)

    it('should not leak script context variables between flow executions', async () => {
        // First execution — injects a variable via template expression
        const firstResult = await flowExecutor.execute({
            action: buildCodeAction({
                name: 'echo_step',
                input: { x: '{{ 42 }}' },
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(firstResult.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(firstResult.steps.echo_step.output).toEqual({ x: 42 })

        // Second execution — tries to read `x` which should not exist
        const secondResult = await flowExecutor.execute({
            action: buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: { leaked: '{{ typeof x }}' },
                },
            }),
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(secondResult.verdict.status).toBe(FlowRunStatus.RUNNING)
        expect(secondResult.steps.data_mapper.output).toEqual({ leaked: 'undefined' })
    })
})
