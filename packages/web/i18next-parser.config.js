module.exports = {
  locales: ['en', 'fr', 'de', 'nl', 'ja', 'es', 'zh', 'pt' ,'zh-TW'], // Your supported languages
  output: 'packages/web/public/locales/$LOCALE/$NAMESPACE.json', // Where to output the JSON files
  input: ['src/**/*.{js,jsx,ts,tsx}', '../core/utils/src/lib/form-errors.ts'], // Where to find your React files, plus the formErrors keys
  defaultNamespace: 'translation', // Default namespace if not specified
  createOldCatalogs: false, // Don’t maintain the existing structure with old keys
  defaultValue: (locale, namespace, key) => (locale === 'en' ? key : ''), // en is the Crowdin source: value must equal the key, other locales stay empty until translated
  lexers: {
    js: [{ lexer: 'JavascriptLexer', functions: ['t', 'translationKey'] }],
    jsx: [{ lexer: 'JavascriptLexer', functions: ['t', 'translationKey'] }],
    ts: [{ lexer: 'JavascriptLexer', functions: ['t', 'translationKey'] }],
    tsx: [{ lexer: 'JavascriptLexer', functions: ['t', 'translationKey'] }],
  },
  keepRemoved: false,
  keySeparator: false, // Disable key separator
  namespaceSeparator: false, // Disable namespace separator
  pluralSeparator: false, // ICU plurals are inline; suppress i18next-style key_one / key_other variants
};