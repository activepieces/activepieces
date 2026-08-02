import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { FlowActionType, GenericStepOutput, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { runStateStore } from '../../src/lib/helper/run-state-store'

const ROOT_PATH = '[]'
const RUN_ID = 'test-run-id'
const FLOW_VERSION_ID = 'test-flow-version-id'

function makeStepOutput(output: unknown): StepOutput {
    return GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output,
    })
}

function putStep({ name, stepPath = ROOT_PATH, output }: { name: string, stepPath?: string, output: unknown }): StepOutput {
    const stepOutput = makeStepOutput(output)
    runStateStore.put({ name, stepPath, stepOutput, sizeBytes: JSON.stringify(stepOutput).length })
    return stepOutput
}

describe('runStateStore', () => {
    beforeAll(() => {
        process.env.AP_FLOWS_CACHE_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'run-state-store-test-'))
    })

    beforeEach(() => {
        runStateStore.init({ runId: RUN_ID, flowVersionId: FLOW_VERSION_ID })
    })

    afterEach(() => {
        runStateStore.dispose()
    })

    describe('when not initialized', () => {
        beforeEach(() => {
            runStateStore.dispose()
        })

        test('isInitialized returns false', () => {
            expect(runStateStore.isInitialized()).toBe(false)
        })

        test('put is a no-op and does not throw', () => {
            expect(() => putStep({ name: 'step_1', output: { a: 1 } })).not.toThrow()
        })

        test('getStepOutput returns undefined', () => {
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
        })

        test('getStepSize returns undefined', () => {
            expect(runStateStore.getStepSize({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
        })

        test('getAtPath returns an empty object', () => {
            expect(runStateStore.getAtPath({ stepPath: ROOT_PATH })).toEqual({})
        })

        test('dispose is idempotent', () => {
            expect(() => runStateStore.dispose()).not.toThrow()
        })
    })

    describe('init', () => {
        test('isInitialized returns true', () => {
            expect(runStateStore.isInitialized()).toBe(true)
        })

        test('creates the sqlite file under the flow version directory', () => {
            const expectedPath = path.join(process.env.AP_FLOWS_CACHE_PATH!, FLOW_VERSION_ID, `${RUN_ID}.sqlite`)
            expect(fs.existsSync(expectedPath)).toBe(true)
        })

        test('re-init with the same run id without dispose succeeds and starts empty', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            runStateStore.init({ runId: RUN_ID, flowVersionId: FLOW_VERSION_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
            putStep({ name: 'step_2', output: { b: 2 } })
            expect(runStateStore.getStepOutput({ name: 'step_2', stepPath: ROOT_PATH })).toBeDefined()
        })

        test('init succeeds over a leftover stale file from a killed run', () => {
            runStateStore.dispose()
            const filePath = path.join(process.env.AP_FLOWS_CACHE_PATH!, FLOW_VERSION_ID, `${RUN_ID}.sqlite`)
            fs.writeFileSync(filePath, 'not a sqlite database')
            runStateStore.init({ runId: RUN_ID, flowVersionId: FLOW_VERSION_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            putStep({ name: 'step_1', output: { a: 1 } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeDefined()
        })

        test('init failure leaves the store uninitialized and all operations safe', () => {
            runStateStore.dispose()
            const savedCachePath = process.env.AP_FLOWS_CACHE_PATH
            delete process.env.AP_FLOWS_CACHE_PATH
            try {
                expect(() => runStateStore.init({ runId: RUN_ID, flowVersionId: FLOW_VERSION_ID })).not.toThrow()
                expect(runStateStore.isInitialized()).toBe(false)
                expect(() => putStep({ name: 'step_1', output: { a: 1 } })).not.toThrow()
                expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
            }
            finally {
                process.env.AP_FLOWS_CACHE_PATH = savedCachePath
            }
        })
    })

    describe('put and getStepOutput', () => {
        test('round-trips a step output', () => {
            const stepOutput = putStep({ name: 'step_1', output: { name: 'John', nested: { count: 42 }, items: [1, 'a', null] } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toEqual(stepOutput)
        })

        test('returns undefined for a missing step', () => {
            expect(runStateStore.getStepOutput({ name: 'missing', stepPath: ROOT_PATH })).toBeUndefined()
        })

        test('returns undefined for the same step at a different path', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: '[0]' })).toBeUndefined()
        })

        test('replaces an existing step output for the same name and path', () => {
            putStep({ name: 'step_1', output: { version: 1 } })
            const updated = putStep({ name: 'step_1', output: { version: 2 } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toEqual(updated)
        })

        test('stores the same step name independently per path', () => {
            const rootOutput = putStep({ name: 'step_1', output: { scope: 'root' } })
            const loopOutput = putStep({ name: 'step_1', stepPath: '[["loop_1",0]]', output: { scope: 'loop' } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toEqual(rootOutput)
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: '[["loop_1",0]]' })).toEqual(loopOutput)
        })
    })

    describe('getAtPath', () => {
        test('returns all steps at the given path keyed by name', () => {
            const step1 = putStep({ name: 'step_1', output: { a: 1 } })
            const step2 = putStep({ name: 'step_2', output: { b: 2 } })
            putStep({ name: 'step_3', stepPath: '[["loop_1",0]]', output: { c: 3 } })
            expect(runStateStore.getAtPath({ stepPath: ROOT_PATH })).toEqual({ step_1: step1, step_2: step2 })
        })

        test('returns an empty object when no steps exist at the path', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            expect(runStateStore.getAtPath({ stepPath: '[["loop_1",0]]' })).toEqual({})
        })
    })

    describe('getStepSize', () => {
        test('returns the stored size', () => {
            const stepOutput = makeStepOutput({ a: 1 })
            runStateStore.put({ name: 'step_1', stepPath: ROOT_PATH, stepOutput, sizeBytes: 123 })
            expect(runStateStore.getStepSize({ name: 'step_1', stepPath: ROOT_PATH })).toEqual(123)
        })

        test('returns the latest size after replacement', () => {
            const stepOutput = makeStepOutput({ a: 1 })
            runStateStore.put({ name: 'step_1', stepPath: ROOT_PATH, stepOutput, sizeBytes: 100 })
            runStateStore.put({ name: 'step_1', stepPath: ROOT_PATH, stepOutput, sizeBytes: 200 })
            expect(runStateStore.getStepSize({ name: 'step_1', stepPath: ROOT_PATH })).toEqual(200)
        })

        test('returns undefined for a missing step', () => {
            expect(runStateStore.getStepSize({ name: 'missing', stepPath: ROOT_PATH })).toBeUndefined()
        })
    })

    describe('dispose', () => {
        test('deletes the sqlite file and marks the store uninitialized', () => {
            const sqlitePath = path.join(process.env.AP_FLOWS_CACHE_PATH!, FLOW_VERSION_ID, `${RUN_ID}.sqlite`)
            runStateStore.dispose()
            expect(fs.existsSync(sqlitePath)).toBe(false)
            expect(runStateStore.isInitialized()).toBe(false)
        })

        test('allows re-initializing with the same run id', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            runStateStore.dispose()
            runStateStore.init({ runId: RUN_ID, flowVersionId: FLOW_VERSION_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
        })
    })
})
