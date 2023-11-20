import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import path from 'path'
import fs from 'fs'
import LanguageDetector from 'i18next-browser-languagedetector'
import { logger } from './app/helper/logger'

async function initializeI18next(): Promise<void> {
    try {
        await i18next.use(Backend).use(LanguageDetector).init({
            fallbackLng: 'en',
            preload: ['en', 'fr', 'it', 'de'],
            ns: getPiecesNames(),
            backend: {
                loadPath(lng: string, ns: string) {
                    return path.join(
                        __dirname,
                        '..',
                        '..',
                        'packages',
                        'pieces',
                        ns,
                        'translations',
                        `${lng}.json`,
                    )
                },
            },
            detection: {
                order: ['localStorage'],
                lookupLocalStorage: 'currentLanguage',
                caches: ['localStorage'],
                excludeCacheFor: ['cimode'],
            },
            debug: true,
        })
    }
    catch (err) {
        logger.error('Failed to initialize i18next:', err)
    }
}

function getPiecesNames(): string[] {
    const piecesDir = path.join(__dirname, '..', 'pieces')
    return fs.readdirSync(piecesDir).filter((file) => {
        return fs.statSync(path.join(piecesDir, file)).isDirectory()
    })
}

void initializeI18next()
export default i18next
