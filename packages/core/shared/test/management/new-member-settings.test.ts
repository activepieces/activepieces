import { describe, expect, it } from 'vitest'
import { newMemberSettingsUtils } from '../../src/lib/management/platform/new-member-settings'

describe('newMemberSettingsUtils.activeDefaultProjectIds', () => {
    it('returns the saved default projects on plans with project roles', () => {
        expect(newMemberSettingsUtils.activeDefaultProjectIds({ defaultProjectIds: ['a', 'b'], projectRolesEnabled: true })).toStrictEqual(['a', 'b'])
    })

    it('returns none without project roles, even when some are saved', () => {
        expect(newMemberSettingsUtils.activeDefaultProjectIds({ defaultProjectIds: ['a', 'b'], projectRolesEnabled: false })).toStrictEqual([])
    })
})
