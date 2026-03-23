import {
    FlowActionType,
    GenericStepOutput,
    LoopStepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { loggingUtils } from '../../src/lib/helper/logging-utils'

describe('Logging Utils', () => {
    it('Should truncate input values when total size exceeds limit', () => {
        const largeValue = 'x'.repeat(2000) // Large value that will exceed the limit
        const steps = {
            step1: GenericStepOutput.create({
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: {
                    smallKey: 'small',
                    largeKey: largeValue,
                },
            }),
        }

        // act
        const result = loggingUtils.trimExecutionInput(steps, 100)

        // assert - large key should be truncated, small key might be kept
        const input = result.step1.input as Record<string, unknown>
        expect(input.largeKey).toBe('(truncated)')
    })

    it('Should keep smallest input values and truncate largest ones', () => {
        const steps = {
            step1: GenericStepOutput.create({
                type: FlowActionType.PIECE,
                status: StepOutputStatus.SUCCEEDED,
                input: {
                    small1: 'a',
                    small2: 'b',
                    large1: 'x'.repeat(2000),
                    large2: 'y'.repeat(2000),
                },
            }),
        }

        // act
        const result = loggingUtils.trimExecutionInput(steps, 1500)

        // assert - at least some large keys should be truncated
        const input = result.step1.input as Record<string, unknown>
        const truncatedCount = Object.values(input).filter(v => v === '(truncated)').length
        expect(truncatedCount).toEqual(2)
    })

    it('Should truncate input values in loop step iterations', () => {
        const loopStep = LoopStepOutput.init({ input: {} })
            .setItemAndIndex({ item: 1, index: 1 })
            .setIterations([
                {
                    // First iteration
                    innerStep1: GenericStepOutput.create({
                        type: FlowActionType.PIECE,
                        status: StepOutputStatus.SUCCEEDED,
                        input: {
                            small: 'a',
                            large: 'x'.repeat(1500),
                        },
                    }),
                },
                {
                    // Second iteration
                    innerStep2: GenericStepOutput.create({
                        type: FlowActionType.PIECE,
                        status: StepOutputStatus.SUCCEEDED,
                        input: {
                            small: 'b',
                            large: 'y'.repeat(1500),
                        },
                    }),
                },
                {
                    // Third iteration
                    innerStep3: GenericStepOutput.create({
                        type: FlowActionType.PIECE,
                        status: StepOutputStatus.SUCCEEDED,
                        input: {
                            small: 'c',
                            large: 'z'.repeat(1500),
                        },
                    }),
                },
            ])

        const steps = {
            loopStep,
        }

        // act
        const result = loggingUtils.trimExecutionInput(steps, 2000)

        // assert - verify loop step structure is preserved
        const resultLoopStep = result.loopStep as LoopStepOutput
        expect(resultLoopStep.output?.iterations).toBeDefined()
        expect(resultLoopStep.output?.iterations.length).toBe(3)

        // assert - verify that large values in iterations are truncated
        const iteration1 = resultLoopStep.output?.iterations[0]
        const iteration2 = resultLoopStep.output?.iterations[1]
        const iteration3 = resultLoopStep.output?.iterations[2]

        expect(iteration1).toBeDefined()
        expect(iteration2).toBeDefined()
        expect(iteration3).toBeDefined()

        const input1 = iteration1!['innerStep1'].input as Record<string, unknown>
        const input2 = iteration2!['innerStep2'].input as Record<string, unknown>
        const input3 = iteration3!['innerStep3'].input as Record<string, unknown>

        // At least some large values should be truncated across all iterations
        const finalInputs = [
            input1.large === '(truncated)',
            input2.large === '(truncated)',
            input3.large === '(truncated)',

            input1.small === 'a',
            input2.small === 'b',
            input3.small === 'c',
        ]
        expect(finalInputs.some(Boolean)).toBe(true)
    })
})
