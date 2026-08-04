import { EXACT_VERSION_REGEX, ExactVersionType, VersionType } from './execution-contracts'

describe('Semver Prerelease Version Regex Validation', () => {
    it('validates standard exact semver versions', () => {
        expect(EXACT_VERSION_REGEX.test('0.0.1')).toBe(true)
        expect(EXACT_VERSION_REGEX.test('1.2.3')).toBe(true)
        expect(ExactVersionType.safeParse('1.2.3').success).toBe(true)
    })

    it('validates semver prerelease versions for custom piece installs', () => {
        expect(EXACT_VERSION_REGEX.test('0.0.1-beta.1')).toBe(true)
        expect(EXACT_VERSION_REGEX.test('1.0.0-rc.2')).toBe(true)
        expect(EXACT_VERSION_REGEX.test('2.1.0-alpha.sha123')).toBe(true)

        expect(ExactVersionType.safeParse('0.0.1-beta.1').success).toBe(true)
        expect(ExactVersionType.safeParse('1.0.0-rc.2').success).toBe(true)
    })

    it('validates semver range versions with prereleases', () => {
        expect(VersionType.safeParse('^0.0.1-beta.1').success).toBe(true)
        expect(VersionType.safeParse('~1.2.3-rc.1').success).toBe(true)
    })

    it('rejects malformed versions', () => {
        expect(EXACT_VERSION_REGEX.test('invalid')).toBe(false)
        expect(EXACT_VERSION_REGEX.test('1.0')).toBe(false)
    })
})
