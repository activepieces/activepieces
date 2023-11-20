import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import path from 'path'
import fs from 'fs'
import LanguageDetector from 'i18next-browser-languagedetector';

async function initializeI18next(): Promise<void> {
  try {
    await i18next.use(Backend).use(LanguageDetector).init({
      fallbackLng: 'en',
      preload: ['en', 'fr'],
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
        order: ['path', 'querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupQuerystring: 'lng',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage', 'cookie'],
        excludeCacheFor: ['cimode'],
      },
      debug: true,
    })
  }
  catch (err) {
    console.error('Failed to initialize i18next:', err)
  }
}

function getPiecesNames(): string[] {
  const piecesDir = path.join(__dirname, '..', 'pieces');
  return fs.readdirSync(piecesDir).filter((file) => {
    return fs.statSync(path.join(piecesDir, file)).isDirectory();
  });
}

void initializeI18next()
export default i18next
