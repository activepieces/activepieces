function normalize(locale: string | undefined | null): LocalesEnum {
    if (!locale) {
        return LocalesEnum.ENGLISH
    }
    const supported = SUPPORTED_LOCALES.find((candidate) => candidate === locale)
    return supported ?? LocalesEnum.ENGLISH
}

export enum LocalesEnum {
    DUTCH = 'nl',
    ENGLISH = 'en',
    GERMAN = 'de',
    FRENCH = 'fr',
    SPANISH = 'es',
    JAPANESE = 'ja',
    CHINESE_SIMPLIFIED = 'zh',
    PORTUGUESE = 'pt',
    ARABIC = 'ar',
    CHINESE_TRADITIONAL = 'zh-TW',
}

const SUPPORTED_LOCALES: readonly LocalesEnum[] = Object.values(LocalesEnum)

export const localeUtils = { normalize }
