import { Property } from '@activepieces/pieces-framework';

const COUNTRIES: { label: string; value: string }[] = [
  ['All regions', 'ALL'], ['Argentina', 'AR'], ['Australia', 'AU'], ['Austria', 'AT'], ['Belgium', 'BE'],
  ['Brazil', 'BR'], ['Canada', 'CA'], ['Chile', 'CL'], ['China', 'CN'], ['Denmark', 'DK'], ['Finland', 'FI'],
  ['France', 'FR'], ['Germany', 'DE'], ['Greece', 'GR'], ['Hong Kong', 'HK'], ['India', 'IN'], ['Indonesia', 'ID'],
  ['Italy', 'IT'], ['Japan', 'JP'], ['Korea', 'KR'], ['Malaysia', 'MY'], ['Mexico', 'MX'], ['Netherlands', 'NL'],
  ['New Zealand', 'NZ'], ['Norway', 'NO'], ['Philippines', 'PH'], ['Poland', 'PL'], ['Portugal', 'PT'],
  ['Russia', 'RU'], ['Saudi Arabia', 'SA'], ['South Africa', 'ZA'], ['Spain', 'ES'], ['Sweden', 'SE'],
  ['Switzerland', 'CH'], ['Taiwan', 'TW'], ['Turkey', 'TR'], ['United Kingdom', 'GB'], ['United States', 'US'],
].map(([label, value]) => ({ label, value }));

const SEARCH_LANGUAGES: { label: string; value: string }[] = [
  ['Arabic', 'ar'], ['Basque', 'eu'], ['Bengali', 'bn'], ['Bulgarian', 'bg'], ['Catalan', 'ca'],
  ['Chinese (Simplified)', 'zh-hans'], ['Chinese (Traditional)', 'zh-hant'], ['Croatian', 'hr'], ['Czech', 'cs'],
  ['Danish', 'da'], ['Dutch', 'nl'], ['English', 'en'], ['English (UK)', 'en-gb'], ['Estonian', 'et'],
  ['Finnish', 'fi'], ['French', 'fr'], ['Galician', 'gl'], ['German', 'de'], ['Greek', 'el'], ['Gujarati', 'gu'],
  ['Hebrew', 'he'], ['Hindi', 'hi'], ['Hungarian', 'hu'], ['Icelandic', 'is'], ['Italian', 'it'], ['Japanese', 'jp'],
  ['Kannada', 'kn'], ['Korean', 'ko'], ['Latvian', 'lv'], ['Lithuanian', 'lt'], ['Malay', 'ms'], ['Malayalam', 'ml'],
  ['Marathi', 'mr'], ['Norwegian', 'nb'], ['Polish', 'pl'], ['Portuguese (Brazil)', 'pt-br'],
  ['Portuguese (Portugal)', 'pt-pt'], ['Punjabi', 'pa'], ['Romanian', 'ro'], ['Russian', 'ru'], ['Serbian', 'sr'],
  ['Slovak', 'sk'], ['Slovenian', 'sl'], ['Spanish', 'es'], ['Swedish', 'sv'], ['Tamil', 'ta'], ['Telugu', 'te'],
  ['Thai', 'th'], ['Turkish', 'tr'], ['Ukrainian', 'uk'], ['Vietnamese', 'vi'],
].map(([label, value]) => ({ label, value }));

const SAFESEARCH_FULL = [
  { label: 'Off (no filtering)', value: 'off' },
  { label: 'Moderate (filter explicit content)', value: 'moderate' },
  { label: 'Strict (filter explicit and suggestive content)', value: 'strict' },
];

const SAFESEARCH_IMAGES = [
  { label: 'Off (no filtering)', value: 'off' },
  { label: 'Strict (drop all adult content)', value: 'strict' },
];

function query({ maxChars, maxWords }: { maxChars: number; maxWords: number }) {
  return Property.ShortText({
    displayName: 'Query',
    description: `What to search for. At most ${maxChars} characters and ${maxWords} words.`,
    placeholder: 'e.g. best open-source automation tools',
    required: true,
  });
}

function count({ min, max, defaultValue, description }: { min: number; max: number; defaultValue: number; description?: string }) {
  return Property.Number({
    displayName: 'Number of Results',
    description: description ?? `How many results to return (${min}-${max}, default ${defaultValue}).`,
    required: false,
    defaultValue,
  });
}

function offset() {
  return Property.Number({
    displayName: 'Page Offset',
    description: 'Which page of results to return, counted in pages of "Number of Results" (0-9, default 0 = first page).',
    required: false,
  });
}

function country() {
  return Property.StaticDropdown({
    displayName: 'Country',
    description: 'Country the results should come from. Leave empty for Brave\'s default (United States).',
    required: false,
    options: { options: COUNTRIES },
  });
}

function searchLanguage() {
  return Property.StaticDropdown({
    displayName: 'Search Language',
    description: 'Language of the results. Leave empty for Brave\'s default (English).',
    required: false,
    options: { options: SEARCH_LANGUAGES },
  });
}

function safesearch({ defaultValue }: { defaultValue: string }) {
  return Property.StaticDropdown({
    displayName: 'Safe Search',
    description: `Filter adult content. Default: ${defaultValue}.`,
    required: false,
    defaultValue,
    options: { options: SAFESEARCH_FULL },
  });
}

function imageSafesearch() {
  return Property.StaticDropdown({
    displayName: 'Safe Search',
    description: 'Filter adult content. Image search supports only Off and Strict. Default: strict.',
    required: false,
    defaultValue: 'strict',
    options: { options: SAFESEARCH_IMAGES },
  });
}

function freshness() {
  return Property.StaticDropdown({
    displayName: 'Freshness',
    description: 'Only return results discovered in this time window. Leave empty for any time.',
    required: false,
    options: {
      options: [
        { label: 'Last 24 hours', value: 'pd' },
        { label: 'Last 7 days', value: 'pw' },
        { label: 'Last 31 days', value: 'pm' },
        { label: 'Last 365 days', value: 'py' },
      ],
    },
  });
}

function freshnessRange() {
  return Property.ShortText({
    displayName: 'Custom Date Range',
    description: 'Optional exact range instead of Freshness, written as YYYY-MM-DDtoYYYY-MM-DD (e.g. 2024-01-01to2024-03-31). Overrides Freshness when set.',
    placeholder: '2024-01-01to2024-03-31',
    required: false,
  });
}

function extraSnippets() {
  return Property.Checkbox({
    displayName: 'Extra Snippets',
    description: 'Return up to 5 extra text excerpts per result. Only available on Brave\'s AI and Data plans.',
    required: false,
    defaultValue: false,
  });
}

export const braveProps = {
  query,
  count,
  offset,
  country,
  searchLanguage,
  safesearch,
  imageSafesearch,
  freshness,
  freshnessRange,
  extraSnippets,
};

export const SAFESEARCH_VALUES = ['off', 'moderate', 'strict'];

export const IMAGE_SAFESEARCH_VALUES = ['off', 'strict'];
