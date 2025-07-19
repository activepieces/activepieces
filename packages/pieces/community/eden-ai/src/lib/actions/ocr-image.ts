import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const OCR_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Clarifai', value: 'clarifai' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'SentiSight', value: 'sentisight' },
  { label: 'API4AI', value: 'api4ai' },
  { label: 'Mistral', value: 'mistral' },
];

const OCR_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Abaza', value: 'abq' },
  { label: 'Adyghe', value: 'ady' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Angika', value: 'anp' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Arabic (Pseudo-Accents)', value: 'ar-XA' },
  { label: 'Assamese', value: 'as' },
  { label: 'Asturian', value: 'ast' },
  { label: 'Avaric', value: 'av' },
  { label: 'Awadhi', value: 'awa' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Bagheli', value: 'bfy' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Belarusian (Cyrillic)', value: 'be-cyrl' },
  { label: 'Belarusian (Latin)', value: 'be-latn' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bhojpuri', value: 'bho' },
  { label: 'Bihari languages', value: 'bh' },
  { label: 'Bislama', value: 'bi' },
  { label: 'Bodo (India)', value: 'brx' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Braj', value: 'bra' },
  { label: 'Breton', value: 'br' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Bundeli', value: 'bns' },
  { label: 'Buriat', value: 'bua' },
  { label: 'Camling', value: 'rab' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Cebuano', value: 'ceb' },
  { label: 'Chamorro', value: 'ch' },
  { label: 'Chechen', value: 'ce' },
  { label: 'Chhattisgarhi', value: 'hne' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Chinese (Traditional)', value: 'zh-Hant' },
  { label: 'Cornish', value: 'kw' },
  { label: 'Corsican', value: 'co' },
  { label: 'Crimean Tatar', value: 'crh' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Danish (Denmark)', value: 'da-DK' },
  { label: 'Dargwa', value: 'dar' },
  { label: 'Dari', value: 'prs' },
  { label: 'Dhimal', value: 'dhi' },
  { label: 'Dogri', value: 'doi' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Dutch (Netherlands)', value: 'nl-NL' },
  { label: 'English', value: 'en' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Erzya', value: 'myv' },
  { label: 'Estonian', value: 'et' },
  { label: 'Faroese', value: 'fo' },
  { label: 'Fijian', value: 'fj' },
  { label: 'Filipino', value: 'fil' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Finnish (Finland)', value: 'fi-FI' },
  { label: 'French', value: 'fr' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'Friulian', value: 'fur' },
  { label: 'Gagauz', value: 'gag' },
  { label: 'Galician', value: 'gl' },
  { label: 'German', value: 'de' },
  { label: 'German (Germany)', value: 'de-DE' },
  { label: 'Gilbertese', value: 'gil' },
  { label: 'Goan Konkani', value: 'gom' },
  { label: 'Gondi', value: 'gon' },
  { label: 'Gurung', value: 'gvr' },
  { label: 'Haitian', value: 'ht' },
  { label: 'Halbi', value: 'hlb' },
  { label: 'Hani', value: 'hni' },
  { label: 'Haryanvi', value: 'bgc' },
  { label: 'Hawaiian', value: 'haw' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hmong Daw', value: 'mww' },
  { label: 'Ho', value: 'hoc' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Hungarian (Hungary)', value: 'hu-HU' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Inari Sami', value: 'smn' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Ingush', value: 'inh' },
  { label: 'Interlingua', value: 'ia' },
  { label: 'Inuktitut', value: 'iu' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Italian (Italy)', value: 'it-IT' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Japanese (Japan)', value: 'ja-JP' },
  { label: 'Jaunsari', value: 'jns' },
  { label: 'Javanese', value: 'jv' },
  { label: "K'iche'", value: 'quc' },
  { label: 'Kabardian', value: 'kbd' },
  { label: 'Kabuverdianu', value: 'kea' },
  { label: 'Kachin', value: 'kac' },
  { label: 'Kalaallisut', value: 'kl' },
  { label: 'Kangri', value: 'xnr' },
  { label: 'Kara-Kalpak', value: 'kaa' },
  { label: 'Kara-Kalpak (Cyrillic)', value: 'kaa-Cyrl' },
  { label: 'Karachay-Balkar', value: 'krc' },
  { label: 'Kashubian', value: 'csb' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Kazakh (Cyrillic)', value: 'kk-cyrl' },
  { label: 'Kazakh (Latin)', value: 'kk-latn' },
  { label: 'Khaling', value: 'klr' },
  { label: 'Khasi', value: 'kha' },
  { label: 'Kirghiz', value: 'ky' },
  { label: 'Korean', value: 'ko' },
  { label: 'Korean (South Korea)', value: 'ko-KR' },
  { label: 'Korku', value: 'kfq' },
  { label: 'Koryak', value: 'kpy' },
  { label: 'Kosraean', value: 'kos' },
  { label: 'Kumarbhag Paharia', value: 'kmj' },
  { label: 'Kumyk', value: 'kum' },
  { label: 'Kurdish', value: 'ku' },
  { label: 'Kurdish (Arabic)', value: 'ku-arab' },
  { label: 'Kurdish (Latin)', value: 'ku-latn' },
  { label: 'Kurukh', value: 'kru' },
  { label: 'Kölsch', value: 'ksh' },
  { label: 'Lak', value: 'lbe' },
  { label: 'Lakota', value: 'lkt' },
  { label: 'Latin', value: 'la' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lezghian', value: 'lez' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Lower Sorbian', value: 'dsb' },
  { label: 'Lule Sami', value: 'smj' },
  { label: 'Luxembourgish', value: 'lb' },
  { label: 'Mahasu Pahari', value: 'bfz' },
  { label: 'Maithili', value: 'mai' },
  { label: 'Malay', value: 'ms' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Manx', value: 'gv' },
  { label: 'Maori', value: 'mi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Marshallese', value: 'mh' },
  { label: 'Mongolian', value: 'mn' },
  { label: 'Montenegrin', value: 'cnr' },
  { label: 'Neapolitan', value: 'nap' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Newari', value: 'new' },
  { label: 'Niuean', value: 'niu' },
  { label: 'Nogai', value: 'nog' },
  { label: 'Northern Sami', value: 'se' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Occitan', value: 'oc' },
  { label: 'Old English', value: 'ang' },
  { label: 'Ossetian', value: 'os' },
  { label: 'Pali', value: 'pi' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Polish (Poland)', value: 'pl-PO' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Pushto', value: 'ps' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Romansh', value: 'rm' },
  { label: 'Russian', value: 'ru' },
  { label: 'Russian (Russia)', value: 'ru-RU' },
  { label: 'Sadri', value: 'sck' },
  { label: 'Samoan', value: 'sm' },
  { label: 'Sanskrit', value: 'sa' },
  { label: 'Santali', value: 'sat' },
  { label: 'Scots', value: 'sco' },
  { label: 'Scottish Gaelic', value: 'gd' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Serbian (Cyrillic, Montenegro)', value: 'sr-Cyrl-ME' },
  { label: 'Serbian (Latin)', value: 'sr-latn' },
  { label: 'Serbian (Latin, Montenegro)', value: 'sr-Latn-ME' },
  { label: 'Sherpa', value: 'xsr' },
  { label: 'Sirmauri', value: 'srx' },
  { label: 'Skolt Sami', value: 'sms' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Somali', value: 'so' },
  { label: 'Southern Sami', value: 'sma' },
  { label: 'Spanish', value: 'es' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Swedish (Sweden)', value: 'sv-SE' },
  { label: 'Tabassaran', value: 'tab' },
  { label: 'Tagalog', value: 'tl' },
  { label: 'Tajik', value: 'tg' },
  { label: 'Tatar', value: 'tt' },
  { label: 'Tetum', value: 'tet' },
  { label: 'Thangmi', value: 'thf' },
  { label: 'Tonga', value: 'to' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Turkish (Türkiye)', value: 'tr-TR' },
  { label: 'Turkmen', value: 'tk' },
  { label: 'Tuvinian', value: 'tyv' },
  { label: 'Uighur', value: 'ug' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Upper Sorbian', value: 'hsb' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Uzbek (Arabic)', value: 'uz-arab' },
  { label: 'Uzbek (Cyrillic)', value: 'uz-cyrl' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Volapük', value: 'vo' },
  { label: 'Walser', value: 'wae' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Western Frisian', value: 'fy' },
  { label: 'Yucateco', value: 'yua' },
  { label: 'Zhuang', value: 'za' },
  { label: 'Zulu', value: 'zu' },
  { label: 'Czechia', value: 'cz-CZ' },
  { label: 'Greece', value: 'gr-GR' },
];

function normalizeOcrResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, text: '', bounding_boxes: [], status: 'fail', raw: response };
  }

  return {
    provider,
    text: providerResult.text || '',
    bounding_boxes: providerResult.bounding_boxes || [],
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const ocrImageAction = createAction({
  name: 'ocr_image',
  displayName: 'Extract Text in Image (OCR)',
  description: 'Extract text from images (OCR) using Eden AI. Supports multiple providers, languages, and bounding box coordinates.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for text extraction.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(OCR_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL to the image or document file.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Document Language',
      description: 'The language of the text in the image. Choose "Auto Detection" if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(OCR_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    file_password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Password for protected PDF files (if applicable).',
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description: 'Return extracted data with each attribute as a list instead of list of objects.',
      required: false,
      defaultValue: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(OCR_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: 'Include the raw provider response in the output for debugging.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().min(1, 'Provider is required'),
      file_url: z.string().url('Valid file URL is required'),
      language: z.string().nullish(),
      file_password: z.string().nullish(),
      attributes_as_list: z.boolean().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      file_url, 
      language, 
      file_password, 
      attributes_as_list, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      file_url,
    };

    if (language && language !== 'auto-detect') body['language'] = language;
    if (file_password) body['file_password'] = file_password;
    if (attributes_as_list) body['attributes_as_list'] = attributes_as_list;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/ocr/ocr',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeOcrResponse(provider, response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your file URL and parameters.');
      }
      throw new Error(`Failed to extract text from image: ${err.message || err}`);
    }
  },
}); 