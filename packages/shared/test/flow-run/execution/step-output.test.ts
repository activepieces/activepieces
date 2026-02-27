import { GenericStepOutput, LoopStepOutput, RouterStepOutput, StepOutputStatus } from '../../../src/lib/automation/flow-run/execution/step-output'
import { FlowActionType } from '../../../src/lib/automation/flows/actions/action'

describe('GenericStepOutput', () => {
    it('should create an instance with factory method', () => {
        const step = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: { key: 'value' },
        })
        expect(step.type).toBe(FlowActionType.CODE)
        expect(step.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(step.input).toEqual({ key: 'value' })
        expect(step.output).toBeUndefined()
    })

    it('setOutput should return a new instance without modifying the original', () => {
        const original = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.RUNNING,
            input: {},
        })
        const updated = original.setOutput({ result: 42 })
        expect(updated.output).toEqual({ result: 42 })
        expect(original.output).toBeUndefined()
        expect(updated).not.toBe(original)
    })

    it('setStatus should return a new instance without modifying the original', () => {
        const original = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.RUNNING,
            input: {},
        })
        const updated = original.setStatus(StepOutputStatus.SUCCEEDED)
        expect(updated.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(original.status).toBe(StepOutputStatus.RUNNING)
    })

    it('setErrorMessage should return a new instance without modifying the original', () => {
        const original = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.FAILED,
            input: {},
        })
        const updated = original.setErrorMessage('something went wrong')
        expect(updated.errorMessage).toBe('something went wrong')
        expect(original.errorMessage).toBeUndefined()
    })

    it('setDuration should return a new instance without modifying the original', () => {
        const original = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
        })
        const updated = original.setDuration(1500)
        expect(updated.duration).toBe(1500)
        expect(original.duration).toBeUndefined()
    })
})

describe('LoopStepOutput', () => {
    it('init should create with empty iterations and index 0', () => {
        const loop = LoopStepOutput.init({ input: [1, 2, 3] })
        expect(loop.type).toBe(FlowActionType.LOOP_ON_ITEMS)
        expect(loop.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(loop.output?.iterations).toEqual([])
        expect(loop.output?.index).toBe(0)
        expect(loop.output?.item).toBeUndefined()
    })

    it('addIteration should append an empty iteration', () => {
        const loop = LoopStepOutput.init({ input: null })
        const withIteration = loop.addIteration()
        expect(withIteration.output?.iterations).toHaveLength(1)
        expect(withIteration.output?.iterations[0]).toEqual({})
        expect(loop.output?.iterations).toHaveLength(0)
    })

    it('hasIteration should check if iteration exists', () => {
        const loop = LoopStepOutput.init({ input: null }).addIteration()
        expect(loop.hasIteration(0)).toBe(true)
        expect(loop.hasIteration(1)).toBe(false)
    })

    it('setItemAndIndex should return a new instance with updated item and index', () => {
        const original = LoopStepOutput.init({ input: null })
        const updated = original.setItemAndIndex({ item: 'test', index: 5 })
        expect(updated.output?.item).toBe('test')
        expect(updated.output?.index).toBe(5)
        expect(original.output?.item).toBeUndefined()
        expect(original.output?.index).toBe(0)
        expect(updated).not.toBe(original)
    })

    it('setIterations should replace all iterations', () => {
        const loop = LoopStepOutput.init({ input: null }).addIteration().addIteration()
        const codeStep = GenericStepOutput.create({
            type: FlowActionType.CODE,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
        })
        const newIterations = [{ step1: codeStep }]
        const updated = loop.setIterations(newIterations)
        expect(updated.output?.iterations).toHaveLength(1)
        expect(updated.output?.iterations[0]).toEqual({ step1: codeStep })
        expect(loop.output?.iterations).toHaveLength(2)
    })
})

describe('RouterStepOutput', () => {
    it('init should create with ROUTER type and SUCCEEDED status', () => {
        const router = RouterStepOutput.init({ input: {} })
        expect(router.type).toBe(FlowActionType.ROUTER)
        expect(router.status).toBe(StepOutputStatus.SUCCEEDED)
    })
})
