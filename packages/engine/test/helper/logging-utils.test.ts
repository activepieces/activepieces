import {
    FlowActionType,
    GenericStepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { loggingUtils } from '../../src/lib/helper/logging-utils'

describe('Logging Utils', () => {
    it('Should not truncate whole step if its log size exceeds limit', async () => {
        const steps = {
            mockStep: GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {
                    a: 'a'.repeat(1024 * 1024 * 12),
                },
            }),
        }

        // act
        const result = await loggingUtils.trimExecution(steps)

        // assert
        expect((result.mockStep.input as Record<string, string>).a.length).toBeLessThan(1024 * 1024 * 12)
    })
})
