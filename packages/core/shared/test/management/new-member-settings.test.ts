import { describe, expect, it } from 'vitest'
import { newMemberSettingsUtils } from '../../src/lib/management/platform/new-member-settings'

describe('newMemberSettingsUtils.personalProjectsActive', () => {
    it('follows the saved setting while there is a default project', () => {
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: true, activeDefaultProjectIds: ['a'] })).toBe(true)
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: false, activeDefaultProjectIds: ['a'] })).toBe(false)
    })

    it('keeps personal projects on while there is no default project, whatever was saved', () => {
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: false, activeDefaultProjectIds: [] })).toBe(true)
        expect(newMemberSettingsUtils.personalProjectsActive({ autoCreatePersonalProjects: true, activeDefaultProjectIds: [] })).toBe(true)
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
