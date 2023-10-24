import {
    ActionType,
    ExecutionOutput,
    ExecutionOutputStatus,
    ExecutionState,
    StepOutputStatus,
} from '@activepieces/shared'
import { loggingUtils } from '../../src/lib/helper/logging-utils'

describe('Logging Utils', () => {
    it('Should not truncate whole step if its log size exceeds limit', async () => {
        // arrange
        const mockStepOutput = {
            type: ActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {
                a: 'a'.repeat(2197100),
            },
        }

        const mockExecutionState = new ExecutionState()
        mockExecutionState.insertStep(mockStepOutput, 'mockStep', [])

        const mockExecutionOutput: ExecutionOutput = {
            status: ExecutionOutputStatus.SUCCEEDED,
            executionState: mockExecutionState,
            duration: 10,
            tasks: 10,
        }

        // act
        const result = await loggingUtils.trimExecution(mockExecutionOutput)

        // assert
        expect(result.executionState.steps.mockStep.input).toHaveProperty<string>('a', '(truncated)')
    })
})
