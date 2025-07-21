import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const TEXT_TO_SPEECH_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'LovoAI', value: 'lovoai' },
  { label: 'ElevenLabs', value: 'elevenlabs' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Deepgram', value: 'deepgram' },
];

const TEXT_TO_SPEECH_LANGUAGES = [
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Amharic', value: 'am' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Burmese', value: 'my' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Filipino', value: 'fil' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'Galician', value: 'gl' },
  { label: 'Georgian', value: 'ka' },
  { label: 'German', value: 'de' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Javanese', value: 'jv' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Khmer', value: 'km' },
  { label: 'Korean', value: 'ko' },
  { label: 'Lao', value: 'lo' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Macedonian', value: 'mk' },
  { label: 'Malay', value: 'ms' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Mandarin Chinese', value: 'cmn' },
  { label: 'Maori', value: 'mi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Mongolian', value: 'mn' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Pushto', value: 'ps' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Somali', value: 'so' },
  { label: 'Spanish', value: 'es' },
  { label: 'Standard Arabic', value: 'arb' },
  { label: 'Sundanese', value: 'su' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Tagalog', value: 'tl' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
  { label: 'Thai', value: 'th' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Wu Chinese', value: 'wuu' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Yue Chinese', value: 'yue' },
  { label: 'Zulu', value: 'zu' },
  
  { label: 'Afrikaans (South Africa)', value: 'af-ZA' },
  { label: 'Albanian (Albania)', value: 'sq-AL' },
  { label: 'Amharic (Ethiopia)', value: 'am-ET' },
  { label: 'Arabic (Algeria)', value: 'ar-DZ' },
  { label: 'Arabic (Bahrain)', value: 'ar-BH' },
  { label: 'Arabic (Egypt)', value: 'ar-EG' },
  { label: 'Arabic (Iraq)', value: 'ar-IQ' },
  { label: 'Arabic (Jordan)', value: 'ar-JO' },
  { label: 'Arabic (Kuwait)', value: 'ar-KW' },
  { label: 'Arabic (Lebanon)', value: 'ar-LB' },
  { label: 'Arabic (Libya)', value: 'ar-LY' },
  { label: 'Arabic (Morocco)', value: 'ar-MA' },
  { label: 'Arabic (Oman)', value: 'ar-OM' },
  { label: 'Arabic (Pseudo-Accents)', value: 'ar-XA' },
  { label: 'Arabic (Qatar)', value: 'ar-QA' },
  { label: 'Arabic (Saudi Arabia)', value: 'ar-SA' },
  { label: 'Arabic (Syria)', value: 'ar-SY' },
  { label: 'Arabic (Tunisia)', value: 'ar-TN' },
  { label: 'Arabic (UAE)', value: 'ar-AE' },
  { label: 'Arabic (Yemen)', value: 'ar-YE' },
  { label: 'Armenian (Armenia)', value: 'hy-AM' },
  { label: 'Azerbaijani (Azerbaijan)', value: 'az-AZ' },
  { label: 'Bangla (Bangladesh)', value: 'bn-BD' },
  { label: 'Bangla (India)', value: 'bn-IN' },
  { label: 'Basque (Spain)', value: 'eu-ES' },
  { label: 'Bosnian (Bosnia & Herzegovina)', value: 'bs-BA' },
  { label: 'Bulgarian (Bulgaria)', value: 'bg-BG' },
  { label: 'Burmese (Myanmar)', value: 'my-MM' },
  { label: 'Cantonese (China)', value: 'yue-CN' },
  { label: 'Cantonese (Hong Kong)', value: 'yue-HK' },
  { label: 'Catalan (Spain)', value: 'ca-ES' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Chinese (China - Henan)', value: 'zh-CN-henan' },
  { label: 'Chinese (China - Shandong)', value: 'zh-CN-shandong' },
  { label: 'Chinese (China - Sichuan)', value: 'zh-CN-sichuan' },
  { label: 'Chinese (Hong Kong)', value: 'zh-HK' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Croatian (Croatia)', value: 'hr-HR' },
  { label: 'Czech (Czechia)', value: 'cs-CZ' },
  { label: 'Danish (Denmark)', value: 'da-DK' },
  { label: 'Dutch (Belgium)', value: 'nl-BE' },
  { label: 'Dutch (Netherlands)', value: 'nl-NL' },
  { label: 'English (Australia)', value: 'en-AU' },
  { label: 'English (Canada)', value: 'en-CA' },
  { label: 'English (Curaçao)', value: 'en-AN' },
  { label: 'English (Hong Kong)', value: 'en-HK' },
  { label: 'English (India)', value: 'en-IN' },
  { label: 'English (Ireland)', value: 'en-IE' },
  { label: 'English (Kenya)', value: 'en-KE' },
  { label: 'English (New Zealand)', value: 'en-NZ' },
  { label: 'English (Nigeria)', value: 'en-NG' },
  { label: 'English (Philippines)', value: 'en-PH' },
  { label: 'English (Singapore)', value: 'en-SG' },
  { label: 'English (South Africa)', value: 'en-ZA' },
  { label: 'English (Tanzania)', value: 'en-TZ' },
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Estonian (Estonia)', value: 'et-EE' },
  { label: 'Filipino (Philippines)', value: 'fil-PH' },
  { label: 'Finnish (Finland)', value: 'fi-FI' },
  { label: 'French (Belgium)', value: 'fr-BE' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'French (Switzerland)', value: 'fr-CH' },
  { label: 'Galician (Spain)', value: 'gl-ES' },
  { label: 'Georgian (Georgia)', value: 'ka-GE' },
  { label: 'German (Austria)', value: 'de-AT' },
  { label: 'German (Germany)', value: 'de-DE' },
  { label: 'German (Switzerland)', value: 'de-CH' },
  { label: 'Greek (Greece)', value: 'el-GR' },
  { label: 'Gujarati (India)', value: 'gu-IN' },
  { label: 'Hebrew (Israel)', value: 'he-IL' },
  { label: 'Hindi (India)', value: 'hi-IN' },
  { label: 'Hungarian (Hungary)', value: 'hu-HU' },
  { label: 'Icelandic (Iceland)', value: 'is-IS' },
  { label: 'Indonesian (Indonesia)', value: 'id-ID' },
  { label: 'Irish (Ireland)', value: 'ga-IE' },
  { label: 'Italian (Italy)', value: 'it-IT' },
  { label: 'Japanese (Japan)', value: 'ja-JP' },
  { label: 'Javanese (Indonesia)', value: 'jv-ID' },
  { label: 'Kannada (India)', value: 'kn-IN' },
  { label: 'Kazakh (Kazakhstan)', value: 'kk-KZ' },
  { label: 'Khmer (Cambodia)', value: 'km-KH' },
  { label: 'Korean (South Korea)', value: 'ko-KR' },
  { label: 'Lao (Laos)', value: 'lo-LA' },
  { label: 'Latvian (Latvia)', value: 'lv-LV' },
  { label: 'Lithuanian (Lithuania)', value: 'lt-LT' },
  { label: 'Macedonian (North Macedonia)', value: 'mk-MK' },
  { label: 'Malay (Malaysia)', value: 'ms-MY' },
  { label: 'Malayalam (India)', value: 'ml-IN' },
  { label: 'Maltese (Malta)', value: 'mt-MT' },
  { label: 'Mandarin Chinese (China)', value: 'cmn-CN' },
  { label: 'Mandarin Chinese (Taiwan)', value: 'cmn-TW' },
  { label: 'Marathi (India)', value: 'mr-IN' },
  { label: 'Mongolian (Mongolia)', value: 'mn-MN' },
  { label: 'Nepali (Nepal)', value: 'ne-NP' },
  { label: 'Norwegian Bokmål (Norway)', value: 'nb-NO' },
  { label: 'Pashto (Afghanistan)', value: 'ps-AF' },
  { label: 'Persian (Iran)', value: 'fa-IR' },
  { label: 'Polish (Poland)', value: 'pl-PL' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Punjabi (India)', value: 'pa-IN' },
  { label: 'Romanian (Romania)', value: 'ro-RO' },
  { label: 'Russian (Russia)', value: 'ru-RU' },
  { label: 'Serbian (Serbia)', value: 'sr-RS' },
  { label: 'Sinhala (Sri Lanka)', value: 'si-LK' },
  { label: 'Slovak (Slovakia)', value: 'sk-SK' },
  { label: 'Slovenian (Slovenia)', value: 'sl-SI' },
  { label: 'Somali (Somalia)', value: 'so-SO' },
  { label: 'Spanish (Argentina)', value: 'es-AR' },
  { label: 'Spanish (Bolivia)', value: 'es-BO' },
  { label: 'Spanish (Chile)', value: 'es-CL' },
  { label: 'Spanish (Colombia)', value: 'es-CO' },
  { label: 'Spanish (Costa Rica)', value: 'es-CR' },
  { label: 'Spanish (Cuba)', value: 'es-CU' },
  { label: 'Spanish (Dominican Republic)', value: 'es-DO' },
  { label: 'Spanish (Ecuador)', value: 'es-EC' },
  { label: 'Spanish (El Salvador)', value: 'es-SV' },
  { label: 'Spanish (Equatorial Guinea)', value: 'es-GQ' },
  { label: 'Spanish (Guatemala)', value: 'es-GT' },
  { label: 'Spanish (Honduras)', value: 'es-HN' },
  { label: 'Spanish (Mexico)', value: 'es-MX' },
  { label: 'Spanish (Nicaragua)', value: 'es-NI' },
  { label: 'Spanish (Panama)', value: 'es-PA' },
  { label: 'Spanish (Paraguay)', value: 'es-PY' },
  { label: 'Spanish (Peru)', value: 'es-PE' },
  { label: 'Spanish (Puerto Rico)', value: 'es-PR' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Spanish (United States)', value: 'es-US' },
  { label: 'Spanish (Uruguay)', value: 'es-UY' },
  { label: 'Spanish (Venezuela)', value: 'es-VE' },
  { label: 'Sundanese (Indonesia)', value: 'su-ID' },
  { label: 'Swahili (Kenya)', value: 'sw-KE' },
  { label: 'Swahili (Tanzania)', value: 'sw-TZ' },
  { label: 'Swedish (Sweden)', value: 'sv-SE' },
  { label: 'Tamil (India)', value: 'ta-IN' },
  { label: 'Tamil (Malaysia)', value: 'ta-MY' },
  { label: 'Tamil (Singapore)', value: 'ta-SG' },
  { label: 'Tamil (Sri Lanka)', value: 'ta-LK' },
  { label: 'Telugu (India)', value: 'te-IN' },
  { label: 'Thai (Thailand)', value: 'th-TH' },
  { label: 'Turkish (Türkiye)', value: 'tr-TR' },
  { label: 'Ukrainian (Ukraine)', value: 'uk-UA' },
  { label: 'Urdu (India)', value: 'ur-IN' },
  { label: 'Urdu (Pakistan)', value: 'ur-PK' },
  { label: 'Uzbek (United Kingdom)', value: 'uz-UK' },
  { label: 'Uzbek (Uzbekistan)', value: 'uz-UZ' },
  { label: 'Vietnamese (Vietnam)', value: 'vi-VN' },
  { label: 'Welsh (United Kingdom)', value: 'cy-GB' },
  { label: 'Wu Chinese (China)', value: 'wuu-CN' },
  { label: 'Xhosa (South Africa)', value: 'xh-ZA' },
  { label: 'Zulu (South Africa)', value: 'zu-ZA' },
];

const VOICE_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
];

const AUDIO_FORMATS = [
  { label: 'MP3', value: 'mp3' },
  { label: 'WAV', value: 'wav' },
  { label: 'AAC', value: 'aac' },
  { label: 'OGG', value: 'ogg' },
  { label: 'FLAC', value: 'flac' },
];

function normalizeTextToSpeechResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, audio: '', audio_resource_url: '', voice_type: 0, status: 'fail', raw: response };
  }

  return {
    provider,
    audio: providerResult.audio || '',
    audio_resource_url: providerResult.audio_resource_url || '',
    voice_type: providerResult.voice_type || 0,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const textToSpeechAction = createAction({
  name: 'text_to_speech',
  displayName: 'Generate Audio From Text',
  description: 'Convert text to spoken audio using Eden AI. Supports multiple providers, languages, and voice customization.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for text-to-speech synthesis.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(TEXT_TO_SPEECH_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to convert to speech.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'The language and locale for the speech synthesis (defaults to en-US if not specified).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(TEXT_TO_SPEECH_LANGUAGES),
    }),
    option: Property.Dropdown({
      displayName: 'Voice Gender',
      description: 'Choose the voice gender for speech synthesis (defaults to Female if not specified).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(VOICE_OPTIONS),
    }),
    rate: Property.Number({
      displayName: 'Speaking Rate',
      description: 'Adjust speaking rate (-100 to 100, where 0 is normal speed).',
      required: false,
      defaultValue: 0,
    }),
    pitch: Property.Number({
      displayName: 'Voice Pitch',
      description: 'Adjust voice pitch (-100 to 100, where 0 is normal pitch).',
      required: false,
      defaultValue: 0,
    }),
    volume: Property.Number({
      displayName: 'Audio Volume',
      description: 'Adjust audio volume (-100 to 100, where 0 is normal volume).',
      required: false,
      defaultValue: 0,
    }),
    audio_format: Property.Dropdown({
      displayName: 'Audio Format',
      description: 'The audio format for the generated speech (default: MP3).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(AUDIO_FORMATS),
    }),
    sampling_rate: Property.Number({
      displayName: 'Sampling Rate',
      description: 'Audio sampling rate in Hz (0-200000, 0 for provider default).',
      required: false,
      defaultValue: 0,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(TEXT_TO_SPEECH_PROVIDERS),
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
      text: z.string().min(1, 'Text is required'),
      language: z.string().nullish(),
      option: z.string().nullish(),
      rate: z.number().int().min(-100).max(100).nullish(),
      pitch: z.number().int().min(-100).max(100).nullish(),
      volume: z.number().int().min(-100).max(100).nullish(),
      audio_format: z.string().nullish(),
      sampling_rate: z.number().int().min(0).max(200000).nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      language, 
      option, 
      rate, 
      pitch, 
      volume, 
      audio_format, 
      sampling_rate, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

    const defaultLanguage = language || 'en-US';
    const defaultOption = option || 'FEMALE';
    
    body['language'] = defaultLanguage;
    body['option'] = defaultOption;
    if (rate !== undefined && rate !== 0) body['rate'] = rate;
    if (pitch !== undefined && pitch !== 0) body['pitch'] = pitch;
    if (volume !== undefined && volume !== 0) body['volume'] = volume;
    if (audio_format) body['audio_format'] = audio_format;
    if (sampling_rate !== undefined && sampling_rate !== 0) body['sampling_rate'] = sampling_rate;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/audio/text_to_speech/',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeTextToSpeechResponse(provider, response);
    } catch (err: any) {
      let errorMessage = 'Unknown error occurred';
      
      if (err.response?.body?.error) {
        const errorBody = err.response.body.error;
        
        if (errorBody.message) {
          if (typeof errorBody.message === 'string') {
            errorMessage = errorBody.message;
          } else if (errorBody.message.non_field_errors) {
            errorMessage = errorBody.message.non_field_errors.join(', ');
          } else if (typeof errorBody.message === 'object') {
            const fieldErrors = Object.entries(errorBody.message)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            errorMessage = fieldErrors;
          }
        } else if (typeof errorBody === 'string') {
          errorMessage = errorBody;
        }
        
        throw new Error(`Eden AI API error: ${errorMessage}`);
      }
      
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your text and parameters.');
      }
      if (err.message && typeof err.message === 'string') {
        throw new Error(`Failed to generate audio: ${err.message}`);
      }
      
      throw new Error(`Failed to generate audio: ${JSON.stringify(err)}`);
    }
  },
}); 