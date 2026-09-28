import { LocalesEnum, localeUtils } from '../src/lib/locale'

describe('localeUtils.toSupportedLocale', () => {
    it('returns every supported locale unchanged', () => {
        for (const locale of Object.values(LocalesEnum)) {
            expect(localeUtils.toSupportedLocale(locale)).toBe(locale)
        }
    })

    it('falls back to English for anything it does not recognise', () => {
        const unrecognised = ['', 'xx', 'junk-1', 'en_US', '__proto__', 'constructor', 'toString', 'x'.repeat(10_000)]
        for (const locale of unrecognised) {
            expect(localeUtils.toSupportedLocale(locale)).toBe(LocalesEnum.ENGLISH)
        }
        expect(localeUtils.toSupportedLocale(undefined)).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale(null)).toBe(LocalesEnum.ENGLISH)
    })

    it('does not fold a regional tag onto its base language', () => {
        expect(localeUtils.toSupportedLocale('de-DE')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale('en-US')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale('zh-CN')).toBe(LocalesEnum.ENGLISH)
    })

    it('does not fold case', () => {
        expect(localeUtils.toSupportedLocale('zh-tw')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale('ZH-TW')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale('DE')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.toSupportedLocale(LocalesEnum.CHINESE_TRADITIONAL)).toBe(LocalesEnum.CHINESE_TRADITIONAL)
    })
})
