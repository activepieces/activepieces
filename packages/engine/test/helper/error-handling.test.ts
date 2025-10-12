import { StepOutputStatus } from '@activepieces/shared'
import { codeExecutor } from '../../src/lib/handler/code-executor'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { runWithExponentialBackoff } from '../../src/lib/helper/error-handling'
import { buildCodeAction, deleteCustomCodeFile, generateMockEngineConstants } from '../handler/test-helper'

describe('runWithExponentialBackoff', () => {
    const executionState = FlowExecutorContext.empty()
    const action = buildCodeAction({
        name: 'runtime',
        input: {},
        errorHandlingOptions: {
            continueOnFailure: {
                value: false,
            },
            retryOnFailure: {
                value: true,
            },
        },
    })
    const constants = generateMockEngineConstants()
    const requestFunction = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterAll(() => {
        jest.clearAllMocks()
        deleteCustomCodeFile()
    })

    it('should return resultExecutionState when verdict is not FAILED', async () => {
        const resultExecutionState = FlowExecutorContext.empty().setVerdict(ExecutionVerdict.SUCCEEDED, undefined)
        requestFunction.mockResolvedValue(resultExecutionState)

        const output = await runWithExponentialBackoff(executionState, action, constants, requestFunction)

        expect(output).toEqual(resultExecutionState)
        expect(requestFunction).toHaveBeenCalledWith({ action, executionState, constants })
    })


    it('should retry and return resultExecutionState when verdict is FAILED and retry is enabled', async () => {
        const resultExecutionState = FlowExecutorContext.empty().setVerdict(ExecutionVerdict.FAILED, undefined)

        requestFunction.mockResolvedValue(resultExecutionState)

        const output = await runWithExponentialBackoff(executionState, action, constants, requestFunction)

        expect(output).toEqual(resultExecutionState)
        // Mock applies for the first attempt and second attempt is a real call which return success
        expect(requestFunction).toHaveBeenCalledTimes(2)
        expect(requestFunction).toHaveBeenCalledWith({ action, executionState, constants })
        expect(requestFunction).toHaveBeenCalledWith({ action, executionState, constants })
    })

    it('should not retry and return resultExecutionState when verdict is FAILED but retry is disabled', async () => {
        const resultExecutionState = FlowExecutorContext.empty().setVerdict(ExecutionVerdict.FAILED, undefined)

        requestFunction.mockResolvedValue(resultExecutionState)


        const actionWithDisabledRetry = buildCodeAction({
            name: 'runtime',
            input: {},
            errorHandlingOptions: {
                continueOnFailure: {
                    value: false,
                },
                retryOnFailure: {
                    value: false,
                },
            },
        })

        const output = await runWithExponentialBackoff(executionState, actionWithDisabledRetry, constants, requestFunction)

        expect(output).toEqual(resultExecutionState)
        expect(requestFunction).toHaveBeenCalledTimes(1)
        expect(requestFunction).toHaveBeenCalledWith({ action: actionWithDisabledRetry, executionState, constants })

    })

    it('should return resultExecutionState when verdict is FAILED and continueOnFailure is true with parsed json in error message', async () => {
        const result = await codeExecutor.handle({
            action: buildCodeAction({
                name: 'custom_code',
                input: {},
                code: `
                export const code = async (inputs) => {
                const x = {"msg":"Custom  Error","params":{"key":"value"} }
                throw new Error(JSON.stringify(x))
}`, errorHandlingOptions: {
                    continueOnFailure: {
                        value: true,
                    },
                    retryOnFailure: {
                        value: false,
                    },
                },
            }), executionState: FlowExecutorContext.empty(), constants: generateMockEngineConstants({
                testSingleStepMode: false,
            }),
        })
        expect(result.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(result.steps.custom_code.status).toEqual(StepOutputStatus.FAILED)
        expect(result.steps.custom_code.output).toEqual({ 'msg': 'Custom  Error', 'params': { 'key': 'value' } })
     
    })

})

