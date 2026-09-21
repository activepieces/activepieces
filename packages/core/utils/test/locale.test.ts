import { LocalesEnum, localeUtils } from '../src/lib/locale'

describe('localeUtils.normalize', () => {
    it('returns every supported locale unchanged', () => {
        for (const locale of Object.values(LocalesEnum)) {
            expect(localeUtils.normalize(locale)).toBe(locale)
        }
    })

    it('falls back to English for anything it does not recognise', () => {
        const unrecognised = ['', 'xx', 'junk-1', 'en_US', '__proto__', 'constructor', 'toString', 'x'.repeat(10_000)]
        for (const locale of unrecognised) {
            expect(localeUtils.normalize(locale)).toBe(LocalesEnum.ENGLISH)
        }
        expect(localeUtils.normalize(undefined)).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize(null)).toBe(LocalesEnum.ENGLISH)
    })

    it('does not fold a regional tag onto its base language', () => {
        expect(localeUtils.normalize('de-DE')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize('en-US')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize('zh-CN')).toBe(LocalesEnum.ENGLISH)
    })

    it('does not fold case', () => {
        expect(localeUtils.normalize('zh-tw')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize('ZH-TW')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize('DE')).toBe(LocalesEnum.ENGLISH)
        expect(localeUtils.normalize(LocalesEnum.CHINESE_TRADITIONAL)).toBe(LocalesEnum.CHINESE_TRADITIONAL)
    })
})
