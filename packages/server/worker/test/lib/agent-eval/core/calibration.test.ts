import { describe, expect, it } from 'vitest'
import { evalCalibration } from './calibration'

describe('evalCalibration', () => {
    it('loads only exact pass/fail labels and marks Claude drafts', () => {
        const cases = evalCalibration.loadLabelled()
        expect(cases.every((calibrationCase) => calibrationCase.humanLabel === 'pass' || calibrationCase.humanLabel === 'fail')).toBe(true)
        expect(cases.filter(evalCalibration.isDraft).length).toBe(cases.length)
    })

    it('refuses a case id that would write outside calibration/', () => {
        expect(() => evalCalibration.fileFor({ id: '../../escape' })).toThrow('outside calibration/')
        expect(evalCalibration.fileFor({ id: 'fixture--dim--2026-10-03T14-29-34' })).toMatch(/calibration\/fixture--dim--2026-10-03T14-29-34\.json$/)
    })
})
