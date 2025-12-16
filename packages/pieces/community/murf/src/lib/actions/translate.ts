import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { murfApiCall } from '../common';
import { murfAuth } from '../..';

const SUPPORTED_LANGUAGES = [
  { label: 'English (US)', value: 'en_US' },
  { label: 'English (UK)', value: 'en_GB' },
  { label: 'Spanish (Spain)', value: 'es_ES' },
  { label: 'Spanish (Mexico)', value: 'es_MX' },
  { label: 'French (France)', value: 'fr_FR' },
  { label: 'French (Canada)', value: 'fr_CA' },
  { label: 'German (Germany)', value: 'de_DE' },
  { label: 'Italian (Italy)', value: 'it_IT' },
  { label: 'Portuguese (Brazil)', value: 'pt_BR' },
  { label: 'Portuguese (Portugal)', value: 'pt_PT' },
  { label: 'Dutch (Netherlands)', value: 'nl_NL' },
  { label: 'Russian (Russia)', value: 'ru_RU' },
  { label: 'Japanese (Japan)', value: 'ja_JP' },
  { label: 'Korean (Korea)', value: 'ko_KR' },
  { label: 'Chinese (Simplified)', value: 'zh_CN' },
  { label: 'Chinese (Traditional)', value: 'zh_TW' },
  { label: 'Arabic (Saudi Arabia)', value: 'ar_SA' },
  { label: 'Hindi (India)', value: 'hi_IN' },
  { label: 'Turkish (Turkey)', value: 'tr_TR' },
  { label: 'Polish (Poland)', value: 'pl_PL' },
  { label: 'Swedish (Sweden)', value: 'sv_SE' },
  { label: 'Danish (Denmark)', value: 'da_DK' },
  { label: 'Norwegian (Norway)', value: 'no_NO' },
  { label: 'Finnish (Finland)', value: 'fi_FI' },
  { label: 'Czech (Czech Republic)', value: 'cs_CZ' },
  { label: 'Greek (Greece)', value: 'el_GR' },
  { label: 'Hebrew (Israel)', value: 'he_IL' },
  { label: 'Thai (Thailand)', value: 'th_TH' },
  { label: 'Vietnamese (Vietnam)', value: 'vi_VN' },
  { label: 'Indonesian (Indonesia)', value: 'id_ID' },
  { label: 'Malay (Malaysia)', value: 'ms_MY' },
  { label: 'Romanian (Romania)', value: 'ro_RO' },
  { label: 'Hungarian (Hungary)', value: 'hu_HU' },
  { label: 'Ukrainian (Ukraine)', value: 'uk_UA' },
];

export const translate = createAction({
  name: 'translate',
  auth: murfAuth,
  displayName: 'Translate Text',
  description: 'Translate text to another language',
  props: {
    targetLanguage: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'Language to translate to',
      required: true,
      options: {
        options: SUPPORTED_LANGUAGES,
      },
    }),
    texts: Property.Array({
      displayName: 'Texts',
      description: 'List of texts to translate',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await murfApiCall<{
      metadata: {
        character_count: {
          total_source_text_length: number;
          total_translated_text_length: number;
        };
        credits_used: number;
        target_language: string;
      };
      translations: Array<{
        source_text: string;
        translated_text: string;
      }>;
    }>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/text/translate',
      body: {
        targetLanguage: propsValue.targetLanguage,
        texts: propsValue.texts,
      },
    });

    return response;
  },
});
