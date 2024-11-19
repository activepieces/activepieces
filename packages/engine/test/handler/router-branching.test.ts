import { Action, BranchCondition, BranchOperator, RouterExecutionType } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, buildRouterWithOneCondition, generateMockEngineConstants } from './test-helper'

function executeRouterActionWithOneCondition(children: Action[], conditions: (BranchCondition | null)[], executionType: RouterExecutionType): Promise<FlowExecutorContext> {
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
                name: 'data_mapper_1',
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
        expect(result.steps.data_mapper_1).toBeUndefined()
    })

    it('should execute router with the all matching conditions', async () => {
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
                name: 'data_mapper_1',
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
                secondValue: 'test',
                caseSensitive: false,
            },
        ], RouterExecutionType.EXECUTE_ALL_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.data_mapper_1.output).toEqual({ 'key': 3 })
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
                name: 'data_mapper_1',
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
        const routerOutput = result.steps.router.output as { branches: boolean[] }
        expect(routerOutput.branches).toEqual([false, false])
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
    })

    it('should execute fallback branch with first match execution type', async () => {
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
                name: 'data_mapper_1',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 5 }}',
                    },
                },
            }),
            buildPieceAction({
                name: 'fallback_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 10 }}',
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
            null, // Fallback branch
        ], RouterExecutionType.EXECUTE_FIRST_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
        expect(result.steps.fallback_mapper.output).toEqual({ 'key': 11 })
    })

    it('should execute fallback branch with all match execution type', async () => {
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
                name: 'data_mapper_1',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 5 }}',
                    },
                },
            }),
            buildPieceAction({
                name: 'fallback_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 10 }}',
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
            null, // Fallback branch
        ], RouterExecutionType.EXECUTE_ALL_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
        expect(result.steps.fallback_mapper.output).toEqual({ 'key': 11 })
    })

    it('should not execute fallback branch when there is a matching condition in EXECUTE_FIRST_MATCH mode', async () => {
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
                name: 'fallback_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 10 }}',
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
            null, // Fallback branch
        ], RouterExecutionType.EXECUTE_FIRST_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.fallback_mapper).toBeUndefined()
    })

    it('should not execute fallback branch when there is a matching condition in EXECUTE_ALL_MATCH mode', async () => {
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
                name: 'data_mapper_1',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 5 }}',
                    },
                },
            }),
            buildPieceAction({
                name: 'fallback_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 10 }}',
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
                secondValue: 'test',
                caseSensitive: false,
            },
            null, // Fallback branch
        ], RouterExecutionType.EXECUTE_ALL_MATCH)

        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.data_mapper_1.output).toEqual({ 'key': 6 })
        expect(result.steps.fallback_mapper).toBeUndefined()
    })
})
