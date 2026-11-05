import { describe, expect, it } from 'vitest'
import { StepOutputStatus } from '../../../src/lib/flow-run/execution/step-output'
import { BarrierFanOutSource } from '../../../src/lib/flow-run/waitpoint'

describe('BarrierFanOutSource', () => {
    const source = {
        entryStepName: 'step_2',
        batchStepName: 'batch_1',
        batchSize: 2,
        items: [1, 2, 3],
    }

    it('accepts seed steps that are step outputs and keeps their other fields', () => {
        const seedSteps = { trigger: { type: 'EMPTY', status: StepOutputStatus.SUCCEEDED, input: {}, output: { id: 1 } } }

        expect(BarrierFanOutSource.parse({ ...source, seedSteps }).seedSteps).toEqual(seedSteps)
    })

    it('refuses a seed step that is not a step output, so a bad seed fails at the barrier create instead of in every child', () => {
        expect(BarrierFanOutSource.safeParse({ ...source, seedSteps: { trigger: 'not a step output' } }).success).toBe(false)
        expect(BarrierFanOutSource.safeParse({ ...source, seedSteps: { trigger: { type: 'EMPTY', status: 'DONE' } } }).success).toBe(false)
    })
})
