import { FREE_LEGACY_CUTOFF_ISO, isFreeLegacyEligible, LEGACY_STANDARD_PLAN, PlanName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

const BEFORE_CUTOFF = dayjs(FREE_LEGACY_CUTOFF_ISO).subtract(1, 'day').toISOString()
const AFTER_CUTOFF = dayjs(FREE_LEGACY_CUTOFF_ISO).add(1, 'day').toISOString()

describe('isFreeLegacyEligible', () => {
    it.each([
        ['free before the cutoff', PlanName.FREE, BEFORE_CUTOFF, true],
        ['pre-Autumn standard before the cutoff', LEGACY_STANDARD_PLAN, BEFORE_CUTOFF, true],
        ['free exactly at the cutoff', PlanName.FREE, FREE_LEGACY_CUTOFF_ISO, false],
        ['free after the cutoff', PlanName.FREE, AFTER_CUTOFF, false],
        ['paid before the cutoff', PlanName.PLUS, BEFORE_CUTOFF, false],
        ['already comped before the cutoff', PlanName.FREE_LEGACY, BEFORE_CUTOFF, false],
        ['appsumo before the cutoff', PlanName.APPSUMO, BEFORE_CUTOFF, false],
    ])('%s -> %s', (_label, plan, created, expected) => {
        expect(isFreeLegacyEligible({ plan, created })).toBe(expected)
    })

    it('is false for a null plan, so a dormant row with no plan name is never comped', () => {
        expect(isFreeLegacyEligible({ plan: null, created: BEFORE_CUTOFF })).toBe(false)
    })

    it('is false for a missing or unparseable created date', () => {
        expect(isFreeLegacyEligible({ plan: PlanName.FREE, created: null })).toBe(false)
        expect(isFreeLegacyEligible({ plan: PlanName.FREE, created: 'not-a-date' })).toBe(false)
    })
})
