import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { pieceExecutor } from '../../src/lib/handler/piece-executor'
import { EXECUTE_CONSTANTS, buildPieceAction } from './test-helper'

describe('pieceExecutor', () => {

    it('should execute data mapper successfully', async () => {
        const result = await pieceExecutor.handle({
            action: buildPieceAction({
                name: 'data_mapper',
                pieceName: '@activepieces/piece-data-mapper',
                actionName: 'advanced_mapping',
                input: {
                    mapping: {
                        'key': '{{ 1 + 2 }}',
                    },
                },
            }), executionState: FlowExecutorContext.empty(), constants: EXECUTE_CONSTANTS,
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.data_mapper.output).toEqual({ 'key': 3 })
    })

})