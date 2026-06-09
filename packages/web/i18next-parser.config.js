module.exports = {
  locales: ['en', 'fr', 'de', 'nl', 'ja', 'es', 'zh', 'pt' ,'zh-TW'], // Your supported languages
  output: 'packages/web/public/locales/$LOCALE/$NAMESPACE.json', // Where to output the JSON files
  input: ['src/**/*.{js,jsx,ts,tsx}'], // Where to find your React files
  defaultNamespace: 'translation', // Default namespace if not specified
  createOldCatalogs: false, // Don’t maintain the existing structure with old keys
  defaultValue: (locale, namespace, key) => (locale === 'en' ? key : ''), // en is the Crowdin source: value must equal the key, other locales stay empty until translated
  lexers: {
    js: ['JavascriptLexer'],
    jsx: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
  },
  keepRemoved: false,
  keySeparator: false, // Disable key separator
  namespaceSeparator: false, // Disable namespace separator
  pluralSeparator: false, // ICU plurals are inline; suppress i18next-style key_one / key_other variants
};