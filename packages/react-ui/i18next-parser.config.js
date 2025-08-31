module.exports = {
  locales: ['en', 'fr', 'de', 'nl', 'ja', 'es', 'zh', 'pt' ,'zh-TW'], // Your supported languages
  output: 'packages/react-ui/public/locales/$LOCALE/$NAMESPACE.json', // Where to output the JSON files
  input: ['src/**/*.{js,jsx,ts,tsx}'], // Where to find your React files 
  defaultNamespace: 'translation', // Default namespace if not specified
  createOldCatalogs: false, // Don’t maintain the existing structure with old keys
  lexers: {
    js: ['JavascriptLexer'],
    jsx: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
  },
  keepRemoved: false,
  keySeparator: false, // Disable key separator
  namespaceSeparator: false, // Disable namespace separator
};