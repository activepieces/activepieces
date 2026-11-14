import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { deeplAuth } from '../..';

export const translateText = createAction({
  name: 'translate_text',
  classification: 'READ',
  auth: deeplAuth,
  displayName: 'Translate Text',
  description: 'Translate text into another language with DeepL.',
  audience: 'both',
  aiMetadata: { description: 'Translates a block of plain text into a target language using DeepL\'s neural machine translation. Source language is auto-detected unless explicitly set, and an optional glossary, formality level, and XML/HTML tag handling can be supplied. Choose this to translate natural-language content; the target language is required. Idempotent: re-translating the same text with the same settings yields the same result and creates no resource.', idempotent: true },
  propertyGroups: [
    {
      key: 'translation',
      display: 'section',
      label: 'Translation',
      icon: 'type',
      props: ['text', 'source_lang', 'target_lang'],
    },
    {
      key: 'style',
      display: 'section',
      label: 'Wording',
      icon: 'sliders',
      props: ['formality', 'glossary_id'],
    },
  ],
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description:
        'The text to translate; set Tag Handling if it contains HTML or XML.',
      placeholder: 'Hello, how are you today?',
      required: true,
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source Language',
      description: 'Empty: DeepL detects the language.',
      required: false,
      options: {
        options: [
          { value: 'BG', label: 'Bulgarian' },
          { value: 'CS', label: 'Czech' },
          { value: 'DA', label: 'Danish' },
          { value: 'DE', label: 'German' },
          { value: 'EL', label: 'Greek' },
          { value: 'EN', label: 'English' },
          { value: 'ES', label: 'Spanish' },
          { value: 'ET', label: 'Estonian' },
          { value: 'FI', label: 'Finnish' },
          { value: 'FR', label: 'French' },
          { value: 'HU', label: 'Hungarian' },
          { value: 'ID', label: 'Indonesian' },
          { value: 'IT', label: 'Italian' },
          { value: 'JA', label: 'Japanese' },
          { value: 'KO', label: 'Korean' },
          { value: 'LT', label: 'Lithuanian' },
          { value: 'LV', label: 'Latvian' },
          { value: 'NB', label: 'Norwegian' },
          { value: 'NL', label: 'Dutch' },
          { value: 'PL', label: 'Polish' },
          { value: 'PT', label: 'Portuguese' },
          { value: 'RO', label: 'Romanian' },
          { value: 'RU', label: 'Russian' },
          { value: 'SK', label: 'Slovak' },
          { value: 'SL', label: 'Slovenian' },
          { value: 'SV', label: 'Swedish' },
          { value: 'TR', label: 'Turkish' },
          { value: 'UK', label: 'Ukrainian' },
          { value: 'ZH', label: 'Chinese' },
        ],
      },
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'English and Portuguese have regional variants.',
      required: true,
      options: {
        options: [
          { value: 'BG', label: 'Bulgarian' },
          { value: 'CS', label: 'Czech' },
          { value: 'DA', label: 'Danish' },
          { value: 'DE', label: 'German' },
          { value: 'EL', label: 'Greek' },
          { value: 'EN-GB', label: 'English (UK)' },
          { value: 'EN-US', label: 'English (US)' },
          { value: 'ES', label: 'Spanish' },
          { value: 'ET', label: 'Estonian' },
          { value: 'FI', label: 'Finnish' },
          { value: 'FR', label: 'French' },
          { value: 'HU', label: 'Hungarian' },
          { value: 'ID', label: 'Indonesian' },
          { value: 'IT', label: 'Italian' },
          { value: 'JA', label: 'Japanese' },
          { value: 'KO', label: 'Korean' },
          { value: 'LT', label: 'Lithuanian' },
          { value: 'LV', label: 'Latvian' },
          { value: 'NB', label: 'Norwegian' },
          { value: 'NL', label: 'Dutch' },
          { value: 'PL', label: 'Polish' },
          { value: 'PT-BR', label: 'Portuguese (BR)' },
          { value: 'PT-PT', label: 'Portuguese (PT)' },
          { value: 'RO', label: 'Romanian' },
          { value: 'RU', label: 'Russian' },
          { value: 'SK', label: 'Slovak' },
          { value: 'SL', label: 'Slovenian' },
          { value: 'SV', label: 'Swedish' },
          { value: 'TR', label: 'Turkish' },
          { value: 'UK', label: 'Ukrainian' },
          { value: 'ZH', label: 'Chinese' },
        ],
      },
    }),
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description:
        'Only some target languages support it; "if supported" never fails.',
      required: false,
      options: {
        options: [
          { value: 'default', label: 'Default' },
          { value: 'more', label: 'More formal' },
          { value: 'less', label: 'Less formal' },
          { value: 'prefer_more', label: 'More formal, if supported' },
          { value: 'prefer_less', label: 'Less formal, if supported' },
        ],
      },
    }),
    glossary_id: Property.ShortText({
      displayName: 'Glossary ID',
      description:
        'Get it via a Custom API Call to /glossaries; needs a Source Language.',
      placeholder: 'def3a26b-3e84-45b3-84ae-0c0aaf3525f7',
      required: false,
    }),
    preserve_formatting: Property.StaticDropdown({
      displayName: 'Preserve Formatting',
      description: 'Yes keeps punctuation and casing as written.',
      advanced: true,
      required: false,
      options: {
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    }),
    split_sentences: Property.StaticDropdown({
      displayName: 'Split Sentences',
      description:
        'Empty: on punctuation and new lines (punctuation only for HTML).',
      advanced: true,
      required: false,
      options: {
        options: [
          { value: '0', label: "Don't split" },
          { value: '1', label: 'On punctuation and new lines' },
          { value: 'nonewlines', label: 'On punctuation only' },
        ],
      },
    }),
    tag_handling: Property.StaticDropdown({
      displayName: 'Tag Handling',
      description: 'Set when the text contains XML or HTML tags.',
      advanced: true,
      required: false,
      options: {
        options: [
          { value: 'xml', label: 'XML' },
          { value: 'html', label: 'HTML' },
        ],
      },
    }),
    outline_detection: Property.StaticDropdown({
      displayName: 'Outline Detection',
      description: 'XML only; set No to turn off automatic structure detection.',
      advanced: true,
      required: false,
      options: {
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    }),
    non_splitting_tags: Property.ShortText({
      displayName: 'Non-Splitting Tags',
      description: 'Comma-separated tags that never split a sentence.',
      placeholder: 'b, i, span',
      advanced: true,
      required: false,
    }),
    splitting_tags: Property.ShortText({
      displayName: 'Splitting Tags',
      description: 'Comma-separated tags that always start a new sentence.',
      placeholder: 'p, br, li',
      advanced: true,
      required: false,
    }),
    ignore_tags: Property.ShortText({
      displayName: 'Ignored Tags',
      description: 'Comma-separated tags whose content is not translated.',
      placeholder: 'code, pre',
      advanced: true,
      required: false,
    }),
  },
  async run(context) {
    const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate';
    const DEEPL_PAID_URL = 'https://api.deepl.com/v2/translate';
    const {
      text,
      target_lang,
      source_lang,
      split_sentences,
      preserve_formatting,
      formality,
      glossary_id,
      tag_handling,
      outline_detection,
      non_splitting_tags,
      splitting_tags,
      ignore_tags,
    } = context.propsValue;
    const request = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: context.auth.props.type === 'free' ? DEEPL_FREE_URL : DEEPL_PAID_URL,
      headers: {
        Authorization: `DeepL-Auth-Key ${context.auth.props.key}`,
        'Content-Type': 'application/json',
      },
      body: {
        text: [text],
        target_lang: target_lang,
        source_lang: source_lang,
        split_sentences: split_sentences,
        preserve_formatting: preserve_formatting,
        formality: formality,
        glossary_id: glossary_id,
        tag_handling: tag_handling,
        outline_detection: outline_detection,
        non_splitting_tags: toTagList(non_splitting_tags),
        splitting_tags: toTagList(splitting_tags),
        ignore_tags: toTagList(ignore_tags),
      },
    });

    return request.body;
  },
});

function toTagList(value: string | undefined): string[] | undefined {
  const tags = (value ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
  return tags.length > 0 ? tags : undefined;
}
