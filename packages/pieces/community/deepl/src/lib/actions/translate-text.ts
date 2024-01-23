import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { deeplAuth } from '../..';

export const translateText = createAction({
  name: 'translate_text',
  auth: deeplAuth,
  displayName: 'Translate text',
  description: 'Translate a text to the target language',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description:
        'Text to be translated. Only UTF-8-encoded plain text is supported.',
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target language',
      description: 'The language into which the text should be translated.',
      required: true,
      options: {
        options: [
          { value: 'BG', label: 'Bulgarian' },
          { value: 'CS', label: 'Czech' },
          { value: 'DA', label: 'Danish' },
          { value: 'DE', label: 'German' },
          { value: 'EL', label: 'Greek' },
          { value: 'EN-GB', label: 'English (British)' },
          { value: 'EN-US', label: 'English (American)' },
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
          { value: 'PT-BR', label: 'Portuguese (Brazilian)' },
          { value: 'PT-PT', label: 'Portuguese' },
          { value: 'RO', label: 'Romanian' },
          { value: 'RU', label: 'Russian' },
          { value: 'SK', label: 'Slovak' },
          { value: 'SL', label: 'Slovenian' },
          { value: 'SV', label: 'Swedish' },
          { value: 'TR', label: 'Turkish' },
          { value: 'UK', label: 'Ukrainian' },
          { value: 'ZH', label: 'Chinese (simplified)' },
        ],
      },
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source language',
      description: 'Language of the text to be translated',
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
    split_sentences: Property.StaticDropdown({
      displayName: 'Split sentences',
      description:
        'Sets whether the translation engine should first split the input into sentences. For text translations where tag_handling is not set to html, the default value is 1, meaning the engine splits on punctuation and on newlines.',
      required: false,
      options: {
        options: [
          {
            value: '0',
            label:
              'No splitting at all, whole input is treated as one sentence',
          },
          { value: '1', label: 'Splits on punctuation and on newlines' },
          {
            value: 'nonewlines',
            label: 'Splits on punctuation only, ignoring newlines',
          },
        ],
      },
    }),
    preserve_formatting: Property.StaticDropdown({
      displayName: 'Preserve formatting',
      description:
        'Sets whether the translation engine should respect the original formatting, even if it would usually correct some aspects.',
      required: false,
      options: {
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    }),
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description:
        'Sets whether the translated text should lean towards formal or informal language.',
      required: false,
      options: {
        options: [
          { value: 'default', label: 'Default' },
          { value: 'more', label: 'For a more formal language' },
          { value: 'less', label: 'For a more informal language' },
          {
            value: 'prefer_more',
            label:
              'For a more formal language if available, otherwise fallback to default formality',
          },
          {
            value: 'prefer_less',
            label:
              'For a more informal language if available, otherwise fallback to default formality',
          },
        ],
      },
    }),
    glossary_id: Property.ShortText({
      displayName: 'Glossary id',
      description: 'Specify the glossary to use for the translation.',
      required: false,
    }),
    tag_handling: Property.StaticDropdown({
      displayName: 'Tag handling',
      description: 'Sets which kind of tags should be handled.',
      required: false,
      options: {
        options: [
          { value: 'xml', label: 'Enable XML tag handling' },
          { value: 'html', label: 'Enable HTML tag handling' },
        ],
      },
    }),
    outline_detection: Property.StaticDropdown({
      displayName: 'Outline detection',
      description:
        "The automatic detection of the XML structure won't yield best results in all XML files.",
      required: false,
      options: {
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
      },
    }),
    non_splitting_tags: Property.ShortText({
      displayName: 'Non splitting tags',
      description: 'Comma-separated list of XML or HTML tags.',
      required: false,
    }),
    splitting_tags: Property.ShortText({
      displayName: 'Splitting tags',
      description: 'Comma-separated list of XML or HTML tags.',
      required: false,
    }),
    ignore_tags: Property.ShortText({
      displayName: 'Ignore tags',
      description: 'Comma-separated list of XML or HTML tags.',
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
      url: context.auth.type === 'free' ? DEEPL_FREE_URL : DEEPL_PAID_URL,
      headers: {
        Authorization: `DeepL-Auth-Key ${context.auth.key}`,
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
        non_splitting_tags: non_splitting_tags?.split(','),
        splitting_tags: splitting_tags?.split(','),
        ignore_tags: ignore_tags?.split(','),
      },
    });

    return request.body;
  },
});
