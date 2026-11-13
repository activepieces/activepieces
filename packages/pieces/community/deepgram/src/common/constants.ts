export const BASE_URL = 'https://api.deepgram.com/v1';
export const AGENT_BASE_URL = 'https://agent.deepgram.com/v1';

export const LANG_OPTIONS = [
  { label: 'bg', value: 'bg' },
  { label: 'ca', value: 'ca' },
  { label: 'zh', value: 'zh' },
  { label: 'zh-CN', value: 'zh-CN' },
  { label: 'zh-TW', value: 'zh-TW' },
  { label: 'zh-HK', value: 'zh-HK' },
  { label: 'zh-Hans', value: 'zh-Hans' },
  { label: 'zh-Hant', value: 'zh-Hant' },
  { label: 'cs', value: 'cs' },
  { label: 'da', value: 'da' },
  { label: 'da-DK', value: 'da-DK' },
  { label: 'nl', value: 'nl' },
  { label: 'nl-BE', value: 'nl-BE' },
  { label: 'en', value: 'en' },
  { label: 'en-US', value: 'en-US' },
  { label: 'en-AU', value: 'en-AU' },
  { label: 'en-GB', value: 'en-GB' },
  { label: 'en-NZ', value: 'en-NZ' },
  { label: 'en-IN', value: 'en-IN' },
  { label: 'et', value: 'et' },
  { label: 'fi', value: 'fi' },
  { label: 'fr', value: 'fr' },
  { label: 'fr-CA', value: 'fr-CA' },
  { label: 'de', value: 'de' },
  { label: 'de-CH', value: 'de-CH' },
  { label: 'el', value: 'el' },
  { label: 'hi', value: 'hi' },
  { label: 'hi-Latn', value: 'hi-Latn' },
  { label: 'hu', value: 'hu' },
  { label: 'id', value: 'id' },
  { label: 'it', value: 'it' },
  { label: 'ja', value: 'ja' },
  { label: 'ko', value: 'ko' },
  { label: 'ko-KR', value: 'ko-KR' },
  { label: 'lv', value: 'lv' },
  { label: 'lt', value: 'lt' },
  { label: 'ms', value: 'ms' },
  { label: 'no', value: 'no' },
  { label: 'pl', value: 'pl' },
  { label: 'pt', value: 'pt' },
  { label: 'pt-BR', value: 'pt-BR' },
  { label: 'pt-PT', value: 'pt-PT' },
  { label: 'ro', value: 'ro' },
  { label: 'ru', value: 'ru' },
  { label: 'sk', value: 'sk' },
  { label: 'es', value: 'es' },
  { label: 'es-419', value: 'es-419' },
  { label: 'es-LATAM', value: 'es-LATAM' },
  { label: 'sv', value: 'sv' },
  { label: 'sv-SE', value: 'sv-SE' },
  { label: 'taq', value: 'taq' },
  { label: 'th', value: 'th' },
  { label: 'th-TH', value: 'th-TH' },
  { label: 'tr', value: 'tr' },
  { label: 'uk', value: 'uk' },
  { label: 'vi', value: 'vi' },
];

export const DEFAULT_STT_MODEL = 'nova-3';

export const DEFAULT_AI_VOICE = 'aura-2-thalia-en';

export const MAX_TTS_CHARACTERS = 2000;

export const TTS_ENCODING_OPTIONS = [
  { label: 'MP3', value: 'mp3' },
  { label: 'Linear PCM 16-bit (WAV)', value: 'linear16' },
  { label: 'FLAC', value: 'flac' },
  { label: 'μ-law (WAV)', value: 'mulaw' },
  { label: 'A-law (WAV)', value: 'alaw' },
  { label: 'Opus (OGG)', value: 'opus' },
  { label: 'AAC', value: 'aac' },
];

export const REDACT_OPTIONS = [
  { label: 'Payment card data (PCI)', value: 'pci' },
  { label: 'Personal information (PII)', value: 'pii' },
  { label: 'Health information (PHI)', value: 'phi' },
  { label: 'Numbers', value: 'numbers' },
];
