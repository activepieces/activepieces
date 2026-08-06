import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { FlowActionType, GenericStepOutput, RUN_STATE_STORE_DIR_PREFIX, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { runStateStore } from '../../src/lib/helper/run-state-store'

const ROOT_PATH = '[]'
const RUN_ID = 'test-run-id'

function sqliteFilePath(): string {
    const datedDir = `${RUN_STATE_STORE_DIR_PREFIX}${new Date().toISOString().slice(0, 10)}`
    return path.join(process.env.AP_FLOWS_CACHE_PATH!, datedDir, `${RUN_ID}.sqlite`)
}

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
        runStateStore.init({ runId: RUN_ID })
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

        test('dispose is idempotent', () => {
            expect(() => runStateStore.dispose()).not.toThrow()
        })
    })

    describe('init', () => {
        test('isInitialized returns true', () => {
            expect(runStateStore.isInitialized()).toBe(true)
        })

        test('creates the sqlite file under the dated store directory', () => {
            const expectedPath = sqliteFilePath()
            expect(fs.existsSync(expectedPath)).toBe(true)
        })

        test('re-init with the same run id without dispose succeeds and starts empty', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            runStateStore.init({ runId: RUN_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
            putStep({ name: 'step_2', output: { b: 2 } })
            expect(runStateStore.getStepOutput({ name: 'step_2', stepPath: ROOT_PATH })).toBeDefined()
        })

        test('init succeeds over a leftover stale file from a killed run', () => {
            runStateStore.dispose()
            const filePath = sqliteFilePath()
            fs.writeFileSync(filePath, 'not a sqlite database')
            runStateStore.init({ runId: RUN_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            putStep({ name: 'step_1', output: { a: 1 } })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeDefined()
        })

        test('init failure leaves the store uninitialized and all operations safe', () => {
            runStateStore.dispose()
            const savedCachePath = process.env.AP_FLOWS_CACHE_PATH
            delete process.env.AP_FLOWS_CACHE_PATH
            try {
                expect(() => runStateStore.init({ runId: RUN_ID })).not.toThrow()
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

    describe('deleteStep', () => {
        test('removes an existing row', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            runStateStore.deleteStep({ name: 'step_1', stepPath: ROOT_PATH })
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
            expect(runStateStore.getStepSize({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
        })

        test('is a no-op when not initialized', () => {
            runStateStore.dispose()
            expect(() => runStateStore.deleteStep({ name: 'step_1', stepPath: ROOT_PATH })).not.toThrow()
        })
    })

    describe('slices', () => {
        test('round-trips slice json', () => {
            runStateStore.putSlice({ fileId: 'file-1', json: '{"big":"payload"}' })
            expect(runStateStore.getSliceJson({ fileId: 'file-1' })).toEqual('{"big":"payload"}')
        })

        test('replaces an existing slice for the same file id', () => {
            runStateStore.putSlice({ fileId: 'file-1', json: '{"version":1}' })
            runStateStore.putSlice({ fileId: 'file-1', json: '{"version":2}' })
            expect(runStateStore.getSliceJson({ fileId: 'file-1' })).toEqual('{"version":2}')
        })

        test('returns undefined for a missing file id', () => {
            expect(runStateStore.getSliceJson({ fileId: 'missing' })).toBeUndefined()
        })

        test('put and get are safe no-ops when not initialized', () => {
            runStateStore.dispose()
            expect(() => runStateStore.putSlice({ fileId: 'file-1', json: '{}' })).not.toThrow()
            expect(runStateStore.getSliceJson({ fileId: 'file-1' })).toBeUndefined()
        })
    })

    describe('dispose', () => {
        test('deletes the sqlite file and marks the store uninitialized', () => {
            const sqlitePath = sqliteFilePath()
            runStateStore.dispose()
            expect(fs.existsSync(sqlitePath)).toBe(false)
            expect(runStateStore.isInitialized()).toBe(false)
        })

        test('allows re-initializing with the same run id', () => {
            putStep({ name: 'step_1', output: { a: 1 } })
            runStateStore.dispose()
            runStateStore.init({ runId: RUN_ID })
            expect(runStateStore.isInitialized()).toBe(true)
            expect(runStateStore.getStepOutput({ name: 'step_1', stepPath: ROOT_PATH })).toBeUndefined()
        })
    })
})
