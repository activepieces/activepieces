import {
    ActionType,
    GenericStepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { loggingUtils } from '../../src/lib/helper/logging-utils'

describe('Logging Utils', () => {
    it('Should not truncate whole step if its log size exceeds limit', async () => {
        const steps = {
            mockStep: GenericStepOutput.create({
                type: ActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {
                    a: 'a'.repeat(1024 * 1024 * 4),
                },
            }),
        }

        // act
        const result = await loggingUtils.trimExecution(steps)

        // assert
        expect(result.mockStep.input).toHaveProperty<string>('a', '(truncated)')
    })
})
