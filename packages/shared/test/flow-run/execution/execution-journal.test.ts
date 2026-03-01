import { executionJournal } from '../../../src/lib/automation/flow-run/execution/execution-journal'
import { GenericStepOutput, LoopStepOutput, StepOutput, StepOutputStatus } from '../../../src/lib/automation/flow-run/execution/step-output'
import { FlowActionType } from '../../../src/lib/automation/flows/actions/action'

function createCodeStep(status: StepOutputStatus = StepOutputStatus.SUCCEEDED): StepOutput {
    return GenericStepOutput.create({
        type: FlowActionType.CODE,
        status,
        input: {},
    })
}

function createLoopWithIterations(iterations: Record<string, StepOutput>[]): LoopStepOutput {
    return LoopStepOutput.init({ input: null }).setIterations(iterations)
}

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

describe('executionJournal.getStateAtPath', () => {
    it('should return root steps for empty path', () => {
        const steps: Record<string, StepOutput> = {
            step1: createCodeStep(),
        }
        const result = executionJournal.getStateAtPath({ path: [], steps })
        expect(result).toBe(steps)
    })

    it('should return iteration state for single-level loop path', () => {
        const innerStep = createCodeStep()
        const loop = createLoopWithIterations([{ inner: innerStep }])
        const steps: Record<string, StepOutput> = { loop }
        const result = executionJournal.getStateAtPath({ path: [['loop', 0]], steps })
        expect(result).toEqual({ inner: innerStep })
    })

    it('should throw when step is not found in path', () => {
        const steps: Record<string, StepOutput> = {}
        expect(() => executionJournal.getStateAtPath({ path: [['missing', 0]], steps })).toThrow('Step missing not found')
    })

    it('should throw when step is not a loop', () => {
        const steps: Record<string, StepOutput> = { step1: createCodeStep() }
        expect(() => executionJournal.getStateAtPath({ path: [['step1', 0]], steps })).toThrow('is not a loop on items step')
    })

    it('should throw when iteration is not found', () => {
        const loop = createLoopWithIterations([{}])
        const steps: Record<string, StepOutput> = { loop }
        expect(() => executionJournal.getStateAtPath({ path: [['loop', 5]], steps })).toThrow('Iteration 5 not found')
    })
})

describe('executionJournal.getOrCreateStateAtPath', () => {
    it('should auto-create missing loop steps', () => {
        const steps: Record<string, StepOutput> = {}
        executionJournal.getOrCreateStateAtPath({ path: [['newLoop', 0]], steps })
        expect(steps['newLoop']).toBeDefined()
        expect(steps['newLoop'].type).toBe(FlowActionType.LOOP_ON_ITEMS)
    })

    it('should auto-create missing iterations', () => {
        const loop = LoopStepOutput.init({ input: null })
        const steps: Record<string, StepOutput> = { loop }
        const result = executionJournal.getOrCreateStateAtPath({ path: [['loop', 0]], steps })
        expect(result).toBeDefined()
        expect(typeof result).toBe('object')
    })

    it('should throw for non-loop type mismatch', () => {
        const steps: Record<string, StepOutput> = { step1: createCodeStep() }
        expect(() => executionJournal.getOrCreateStateAtPath({ path: [['step1', 0]], steps })).toThrow('is not a loop on items step')
    })
})

describe('executionJournal.upsertStep and getStep', () => {
    it('should insert and retrieve a step at root path', () => {
        const steps: Record<string, StepOutput> = {}
        const stepOutput = createCodeStep()
        executionJournal.upsertStep({ stepName: 'myStep', stepOutput, path: [], steps })
        const retrieved = executionJournal.getStep({ stepName: 'myStep', path: [], steps })
        expect(retrieved).toBe(stepOutput)
    })

    it('should overwrite an existing step', () => {
        const steps: Record<string, StepOutput> = { myStep: createCodeStep() }
        const newOutput = createCodeStep(StepOutputStatus.FAILED)
        executionJournal.upsertStep({ stepName: 'myStep', stepOutput: newOutput, path: [], steps })
        const retrieved = executionJournal.getStep({ stepName: 'myStep', path: [], steps })
        expect(retrieved?.status).toBe(StepOutputStatus.FAILED)
    })

    it('should insert a step inside a loop iteration with createLoopIterationIfNotExists', () => {
        const steps: Record<string, StepOutput> = {}
        const stepOutput = createCodeStep()
        executionJournal.upsertStep({
            stepName: 'innerStep',
            stepOutput,
            path: [['loop', 0]],
            steps,
            createLoopIterationIfNotExists: true,
        })
        expect(steps['loop']).toBeDefined()
        const retrieved = executionJournal.getStep({ stepName: 'innerStep', path: [['loop', 0]], steps })
        expect(retrieved).toBe(stepOutput)
    })
})

describe('executionJournal.findLastStepWithStatus', () => {
    it('should find the last step matching a given status', () => {
        const steps: Record<string, StepOutput> = {
            s1: createCodeStep(StepOutputStatus.SUCCEEDED),
            s2: createCodeStep(StepOutputStatus.FAILED),
            s3: createCodeStep(StepOutputStatus.SUCCEEDED),
        }
        expect(executionJournal.findLastStepWithStatus(steps, StepOutputStatus.SUCCEEDED)).toBe('s3')
    })

    it('should return last step when status is undefined', () => {
        const steps: Record<string, StepOutput> = {
            s1: createCodeStep(),
            s2: createCodeStep(),
        }
        expect(executionJournal.findLastStepWithStatus(steps, undefined)).toBe('s2')
    })

    it('should recurse into loop iterations', () => {
        const loop = createLoopWithIterations([
            { inner: createCodeStep(StepOutputStatus.FAILED) },
        ])
        const steps: Record<string, StepOutput> = { loop }
        expect(executionJournal.findLastStepWithStatus(steps, StepOutputStatus.FAILED)).toBe('inner')
    })

    it('should return null when no match is found', () => {
        const steps: Record<string, StepOutput> = {
            s1: createCodeStep(StepOutputStatus.SUCCEEDED),
        }
        expect(executionJournal.findLastStepWithStatus(steps, StepOutputStatus.PAUSED)).toBeNull()
    })
})

describe('executionJournal.getLoopSteps', () => {
    it('should extract flat loop steps', () => {
        const loop = createLoopWithIterations([{}])
        const steps: Record<string, StepOutput> = {
            code: createCodeStep(),
            myLoop: loop,
        }
        const result = executionJournal.getLoopSteps(steps)
        expect(Object.keys(result)).toEqual(['myLoop'])
    })

    it('should extract nested loop steps', () => {
        const innerLoop = createLoopWithIterations([{}])
        const outerLoop = createLoopWithIterations([{ innerLoop }])
        const steps: Record<string, StepOutput> = { outerLoop }
        const result = executionJournal.getLoopSteps(steps)
        expect(Object.keys(result)).toContain('outerLoop')
        expect(Object.keys(result)).toContain('innerLoop')
    })

    it('should return empty object when no loops exist', () => {
        const steps: Record<string, StepOutput> = { s1: createCodeStep() }
        expect(executionJournal.getLoopSteps(steps)).toEqual({})
    })
})

describe('executionJournal.isChildOf', () => {
    it('should return true for a direct child', () => {
        const loop = createLoopWithIterations([{ child: createCodeStep() }])
        expect(executionJournal.isChildOf(loop, 'child')).toBe(true)
    })

    it('should return true for a deeply nested child', () => {
        const innerLoop = createLoopWithIterations([{ deepChild: createCodeStep() }])
        const outerLoop = createLoopWithIterations([{ innerLoop }])
        expect(executionJournal.isChildOf(outerLoop, 'deepChild')).toBe(true)
    })

    it('should return false when child is not found', () => {
        const loop = createLoopWithIterations([{ child: createCodeStep() }])
        expect(executionJournal.isChildOf(loop, 'nonexistent')).toBe(false)
    })

    it('should return false when parent is not a loop', () => {
        const codeStep = createCodeStep()
        expect(executionJournal.isChildOf(codeStep, 'anything')).toBe(false)
    })
})
