import { Action, BranchCondition, BranchOperator, RouterExecutionType } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, buildRouterWithOneCondition, generateMockEngineConstants } from './test-helper'

function executeRouterActionWithOneCondition(children: Action[], conditions: BranchCondition[], executionType: RouterExecutionType): Promise<FlowExecutorContext> {
    return flowExecutor.execute({
        action: buildRouterWithOneCondition({
            children,
            conditions,
            executionType,
        }),
        executionState: FlowExecutorContext.empty(),
        constants: generateMockEngineConstants(),
    })
}
describe('router with branching different conditions', () => {
    it('should execute router with the first matching condition', async () => {
        const result = await executeRouterActionWithOneCondition([
            buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 2 }}',
                    },
                },
            }),
            buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 2 }}',
                    },
                },
            }),
        ], [
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'test',
                caseSensitive: false,
            },
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'anything',
                caseSensitive: false,
            },
        ], RouterExecutionType.EXECUTE_FIRST_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
    })

    it('should execute router with the all matching conditions', async () => {
        const result = await executeRouterActionWithOneCondition([
            // buildPieceAction({
            //     name: 'data_mapper',
            //     pieceName: '@activepieces/piece-data-mapper',
            //     actionName: 'advanced_mapping',
            //     input: {
            //         mapping: {
            //             'key': '{{ 1 + 2 }}',
            //         },
            //     },
            // }),
            // buildPieceAction({
            //     name: 'data_mapper',
            //     pieceName: '@activepieces/piece-data-mapper',
            //     actionName: 'advanced_mapping',
            //     input: {
            //         mapping: {
            //             'key': '{{ 1 + 2 }}',
            //         },
            //     },
            // }),
            buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 5 }}',
                    },
                },
            }),
        ], [
            // {
            //     operator: BranchOperator.TEXT_EXACTLY_MATCHES,
            //     firstValue: 'test',
            //     secondValue: 'test',
            //     caseSensitive: false,
            // },
            // {
            //     operator: BranchOperator.TEXT_EXACTLY_MATCHES,
            //     firstValue: 'test',
            //     secondValue: 'test',
            //     caseSensitive: false,
            // },
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'fasc',
                caseSensitive: false,
            },
        ], RouterExecutionType.EXECUTE_ALL_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
    })

    it('should execute router but no branch will match', async () => {
        const result = await executeRouterActionWithOneCondition([
            buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 2 }}',
                    },
                },
            }),
            buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 5 }}',
                    },
                },
            }),
        ], [
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'abc',
                secondValue: 'test',
                caseSensitive: false,
            },
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'fasc',
                caseSensitive: false,
            },
        ], RouterExecutionType.EXECUTE_ALL_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        const routerOutput = result.steps.router.output as { conditions: boolean[] }
        expect(routerOutput.conditions).toEqual([false, false])
    })
})
