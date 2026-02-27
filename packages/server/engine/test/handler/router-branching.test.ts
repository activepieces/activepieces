import { BranchCondition, BranchOperator, FlowRunStatus, RouterExecutionType } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildFlowVersion, buildPieceAction, buildRouterWithOneCondition, generateMockEngineConstants } from './test-helper'

function executeRouterActionWithOneCondition(branchStepNames: string[][], branchActions: ReturnType<typeof buildPieceAction>[], conditions: (BranchCondition | null)[], executionType: RouterExecutionType): Promise<FlowExecutorContext> {
    const router = buildRouterWithOneCondition({
        branchStepNames,
        conditions,
        executionType,
    })
    const fv = buildFlowVersion([router, ...branchActions])
    return flowExecutor.execute({
        stepNames: ['router'],
        executionState: FlowExecutorContext.empty(),
        constants: generateMockEngineConstants({ flowVersion: fv }),
    })
}
describe('router with branching different conditions', () => {
    it('should execute router with the first matching condition', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1']],
            [dm1, dm2],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.data_mapper_1).toBeUndefined()
    })

    it('should execute router with the all matching conditions', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1']],
            [dm1, dm2],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.data_mapper_1.output).toEqual({ 'key': 3 })
    })

    it('should execute router but no branch will match', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 5 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1']],
            [dm1, dm2],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        const routerOutput = result.steps.router.output as { branches: boolean[] }
        expect(routerOutput.branches).toEqual([
            {
                branchName: 'Test Branch',
                branchIndex: 1,
                evaluation: false,
            },
            {
                branchName: 'Test Branch',
                branchIndex: 2,
                evaluation: false,
            },
        ])
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
    })

    it('should execute fallback branch with first match execution type', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 5 }}',
                },
            },
        })
        const fallback = buildPieceAction({
            name: 'fallback_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 10 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1'], ['fallback_mapper']],
            [dm1, dm2, fallback],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
        expect(result.steps.fallback_mapper.output).toEqual({ 'key': 11 })
    })

    it('should execute fallback branch with all match execution type', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 5 }}',
                },
            },
        })
        const fallback = buildPieceAction({
            name: 'fallback_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 10 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1'], ['fallback_mapper']],
            [dm1, dm2, fallback],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper).toBeUndefined()
        expect(result.steps.data_mapper_1).toBeUndefined()
        expect(result.steps.fallback_mapper.output).toEqual({ 'key': 11 })
    })

    it('should not execute fallback branch when there is a matching condition in EXECUTE_FIRST_MATCH mode', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const fallback = buildPieceAction({
            name: 'fallback_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 10 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['fallback_mapper']],
            [dm1, fallback],
            [
                {
                    operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                    firstValue: 'test',
                    secondValue: 'test',
                    caseSensitive: false,
                },
                null, // Fallback branch
            ], RouterExecutionType.EXECUTE_FIRST_MATCH)

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.fallback_mapper).toBeUndefined()
    })

    it('should not execute fallback branch when there is a matching condition in EXECUTE_ALL_MATCH mode', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 2 }}',
                },
            },
        })
        const dm2 = buildPieceAction({
            name: 'data_mapper_1',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 5 }}',
                },
            },
        })
        const fallback = buildPieceAction({
            name: 'fallback_mapper',
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {
                mapping: {
                    'key': '{{ 1 + 10 }}',
                },
            },
        })
        const result = await executeRouterActionWithOneCondition(
            [['data_mapper'], ['data_mapper_1'], ['fallback_mapper']],
            [dm1, dm2, fallback],
            [
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

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
        expect(result.steps.data_mapper_1.output).toEqual({ 'key': 6 })
        expect(result.steps.fallback_mapper).toBeUndefined()
    })
    it('should skip router', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            skip: true,
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {},
        })
        const router = buildRouterWithOneCondition({ branchStepNames: [['data_mapper']], conditions: [
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'test',
                caseSensitive: false,
            },
        ], executionType: RouterExecutionType.EXECUTE_FIRST_MATCH, skip: true })
        const fv = buildFlowVersion([router, dm1])
        const result = await flowExecutor.execute({
            stepNames: ['router'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.router).toBeUndefined()
    })
    it('should skip router action in flow', async () => {
        const dm1 = buildPieceAction({
            name: 'data_mapper',
            skip: true,
            pieceName: '@activepieces/piece-data-mapper',
            actionName: 'advanced_mapping',
            input: {},
        })
        const router = buildRouterWithOneCondition({ branchStepNames: [['data_mapper']], conditions: [
            {
                operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                firstValue: 'test',
                secondValue: 'test',
                caseSensitive: false,
            },
        ],
        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
        skip: true })
        const echoStep = buildCodeAction({
            name: 'echo_step',
            skip: false,
            input: {
                'key': '{{ 1 + 2 }}',
            },
        })
        const fv = buildFlowVersion([router, dm1, echoStep])
        const result = await flowExecutor.execute({
            stepNames: ['router', 'echo_step'],
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ flowVersion: fv }),
        })
        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(result.steps.router).toBeUndefined()
        expect(result.steps.echo_step.output).toEqual({ 'key': 3 })
    })
})
