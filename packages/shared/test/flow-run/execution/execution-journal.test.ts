import { executionJournal } from '../../../src/lib/flow-run/execution/execution-journal'
import { GenericStepOutput, StepOutput, StepOutputStatus } from '../../../src/lib/flow-run/execution/step-output'
import { FlowActionType } from '../../../src/lib/flows/actions/action'

describe('executionJournal.getPathToStep', () => {
    it('should return correct paths for each step in the flow', () => {
        const steps: Record<string, StepOutput> = {
            step1: GenericStepOutput.create({
                type: FlowActionType.CODE,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }),
            step2: GenericStepOutput.create({
                type: FlowActionType.LOOP_ON_ITEMS,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
                output: {
                    item: 'item1',
                    index: 0,
                    iterations: [
                        {
                            step3: GenericStepOutput.create({
                                type: FlowActionType.CODE,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                            }),
                            step4: GenericStepOutput.create({
                                type: FlowActionType.LOOP_ON_ITEMS,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {
                                    item: 'item1',
                                    index: 0,
                                    iterations: [{
                                        step5: GenericStepOutput.create({
                                            type: FlowActionType.CODE,
                                            status: StepOutputStatus.SUCCEEDED,
                                            input: {},
                                        }),
                                    }],
                                },
                            }),
                        },
                        {
                            step3: GenericStepOutput.create({
                                type: FlowActionType.CODE,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                            }),
                            step4: GenericStepOutput.create({
                                type: FlowActionType.LOOP_ON_ITEMS,
                                status: StepOutputStatus.SUCCEEDED,
                                input: {},
                                output: {
                                    item: 'item1',
                                    index: 0,
                                    iterations: [{
                                        step5: GenericStepOutput.create({
                                            type: FlowActionType.CODE,
                                            status: StepOutputStatus.SUCCEEDED,
                                            input: {},
                                        }),
                                    }],
                                },
                            }),
                        },
                    ],
                },
            }),
        }

        const step3 = executionJournal.getPathToStep(steps, 'step3', { 'step2': 0 })
        expect(step3).toEqual([['step2', 0]])

        const step4 = executionJournal.getPathToStep(steps, 'step4', { 'step2': 1 })
        expect(step4).toEqual([['step2', 1]])

        const step5_0 = executionJournal.getPathToStep(steps, 'step5', { 'step2': 0, 'step4': 0 })
        expect(step5_0).toEqual([['step2', 0], ['step4', 0]])

        const step5_1 = executionJournal.getPathToStep(steps, 'step5', { 'step2': 1, 'step4': 0 })
        expect(step5_1).toEqual([['step2', 1], ['step4', 0]])
    })

})
