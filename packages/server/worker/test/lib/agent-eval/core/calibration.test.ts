import { describe, expect, it } from 'vitest'
import { CalibrationCase, evalCalibration } from './calibration'

describe('evalCalibration', () => {
    it('loads only exact pass/fail labels', () => {
        expect(evalCalibration.loadLabelled().every((calibrationCase) => calibrationCase.humanLabel === 'pass' || calibrationCase.humanLabel === 'fail')).toBe(true)
    })

    it('treats only Claude-written labels as drafts', () => {
        const base: CalibrationCase = { id: 'a', fixtureId: 'f', dimension: 'd', rubric: 'r', transcript: 't', humanLabel: 'pass' }
        expect(evalCalibration.isDraft({ ...base, labelledBy: 'claude' })).toBe(true)
        expect(evalCalibration.isDraft({ ...base, labelledBy: 'louai' })).toBe(false)
        expect(evalCalibration.isDraft(base)).toBe(false)
    })

    it('refuses a case id that would write outside calibration/', () => {
        expect(() => evalCalibration.fileFor({ id: '../../escape' })).toThrow('outside calibration/')
        expect(evalCalibration.fileFor({ id: 'fixture--dim--2026-10-03T14-29-34' })).toMatch(/calibration\/fixture--dim--2026-10-03T14-29-34\.json$/)
    })
})
