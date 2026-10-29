import { describe, expect, it } from 'vitest'
import { newMemberSettingsUtils } from '../../src/lib/management/platform/new-member-settings'

describe('newMemberSettingsUtils.personalProjectsActive', () => {
    it('follows the saved setting on plans with project roles', () => {
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: true, projectRolesEnabled: true })).toBe(true)
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: false, projectRolesEnabled: true })).toBe(false)
    })

    it('keeps personal projects on without project roles, whatever was saved', () => {
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: false, projectRolesEnabled: false })).toBe(true)
    })
})

describe('newMemberSettingsUtils.activeDefaultProjectIds', () => {
    it('returns the saved default projects on plans with project roles', () => {
        expect(newMemberSettingsUtils.activeDefaultProjectIds({ defaultProjectIds: ['a', 'b'], projectRolesEnabled: true })).toStrictEqual(['a', 'b'])
    })

    it('returns none without project roles, even when some are saved', () => {
        expect(newMemberSettingsUtils.activeDefaultProjectIds({ defaultProjectIds: ['a', 'b'], projectRolesEnabled: false })).toStrictEqual([])
    })
})
