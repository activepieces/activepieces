export const AUDIO_FORMATS = [
  { label: 'MP3', value: 'MP3' },
  { label: 'WAV', value: 'WAV' },
  { label: 'FLAC', value: 'FLAC' },
  { label: 'ALAW', value: 'ALAW' },
  { label: 'ULAW', value: 'ULAW' },
  { label: 'PCM', value: 'PCM' },
  { label: 'OGG', value: 'OGG' },
];

export const SAMPLE_RATES = [
  { label: '8000 Hz', value: 8000 },
  { label: '24000 Hz', value: 24000 },
  { label: '44100 Hz', value: 44100 },
  { label: '48000 Hz', value: 48000 },
];

export const CHANNEL_TYPES = [
  { label: 'Mono', value: 'MONO' },
  { label: 'Stereo', value: 'STEREO' },
];

export const DUBBING_TYPES = [
  { label: 'Automated', value: 'AUTOMATED' },
  { label: 'QA', value: 'QA' },
];

export const COMMON_LANGUAGES = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Spanish (Mexico)', value: 'es-MX' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'German', value: 'de-DE' },
  { label: 'Italian', value: 'it-IT' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Dutch', value: 'nl-NL' },
  { label: 'Russian', value: 'ru-RU' },
  { label: 'Japanese', value: 'ja-JP' },
  { label: 'Korean', value: 'ko-KR' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
  { label: 'Arabic', value: 'ar-SA' },
  { label: 'Hindi', value: 'hi-IN' },
  { label: 'Polish', value: 'pl-PL' },
  { label: 'Turkish', value: 'tr-TR' },
];

export const API_ENDPOINTS = {
  AUTH_TOKEN: '/v1/auth/token',
  TEXT_TO_SPEECH: '/v1/speech/generate',
  TRANSLATE_TEXT: '/v1/text/translate',
  CREATE_PROJECT: '/v1/murfdub/projects/create',
  LIST_VOICES: '/v1/speech/voices',
  VOICE_CHANGE: '/v1/voice-changer/convert',
};
