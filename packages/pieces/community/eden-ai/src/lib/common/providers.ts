type Option = { label: string; value: string };

export function createStaticDropdown(options: Option[]) {
  return async () => ({ options });
}

export function normalizeProviderItems<T>(provider: string, response: any, mapFn: (item: any, provider: string) => T) {
  const providerResult = response[provider];
  let items: T[] = [];
  if (providerResult && Array.isArray(providerResult.items)) {
    items = providerResult.items.map((item: any) => mapFn(item, provider));
  }
  return { provider, items, raw: response };
}

export const IMAGE_GENERATION_STATIC_PROVIDERS: Option[] = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'StabilityAI', value: 'stabilityai' },
  { label: 'Replicate', value: 'replicate' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'Leonardo', value: 'leonardo' },
  { label: 'Minimax', value: 'minimax' },
  { label: 'Bytedance', value: 'bytedance' },
];
export const IMAGE_GENERATION_STATIC_MODELS: Option[] = [
  { label: 'dall-e-3 (OpenAI)', value: 'dall-e-3' },
  { label: 'stable-diffusion-v1-6 (StabilityAI)', value: 'stable-diffusion-v1-6' },
  { label: 'classic (Replicate)', value: 'classic' },
  { label: 'titan-image-generator-v1_premium (Amazon)', value: 'titan-image-generator-v1_premium' },
  { label: 'Leonardo Phoenix (Leonardo)', value: 'Leonardo Phoenix' },
  { label: 'image-01 (Minimax)', value: 'image-01' },
  { label: 'seedream-3-0-t2i-250415 (Bytedance)', value: 'seedream-3-0-t2i-250415' },
];
export const IMAGE_GENERATION_STATIC_RESOLUTIONS: Option[] = [
  { label: '256x256', value: '256x256' },
  { label: '512x512', value: '512x512' },
  { label: '1024x1024', value: '1024x1024' },
  { label: '1024x1792', value: '1024x1792' },
  { label: '1792x1024', value: '1792x1024' },
];
export const SPELL_CHECK_STATIC_PROVIDERS: Option[] = [
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'ProWritingAid', value: 'prowritingaid' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'Sapling', value: 'sapling' },
  { label: 'XAI', value: 'xai' },
];
export const SPELL_CHECK_STATIC_MODELS: Option[] = [
  { label: 'Default', value: '' },
  { label: 'gpt-4', value: 'gpt-4' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
  { label: 'o1-mini', value: 'o1-mini' },
  { label: 'o1', value: 'o1' },
  { label: 'o3-mini', value: 'o3-mini' },
  { label: 'gpt-4.1-2025-04-14', value: 'gpt-4.1-2025-04-14' },
  { label: 'command', value: 'command' },
  { label: 'grok-2-latest', value: 'grok-2-latest' },
  { label: 'grok-2', value: 'grok-2' },
];
export const SPELL_CHECK_STATIC_LANGUAGES: Option[] = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Italian', value: 'it' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Russian', value: 'ru' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Auto detection', value: 'auto-detect' },
];
export const SUMMARIZE_STATIC_PROVIDERS: Option[] = [
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'XAI', value: 'xai' },
];
export const SUMMARIZE_STATIC_MODELS: Option[] = [
  { label: 'Default', value: '' },
  { label: 'gpt-4', value: 'gpt-4' },
  { label: 'gpt-3.5-turbo-1106', value: 'gpt-3.5-turbo-1106' },
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
  { label: 'gpt-3.5-turbo-16k', value: 'gpt-3.5-turbo-16k' },
  { label: 'gpt-4-32k-0314', value: 'gpt-4-32k-0314' },
  { label: 'gpt-4-turbo-2024-04-09', value: 'gpt-4-turbo-2024-04-09' },
  { label: 'gpt-3.5-turbo-0125', value: 'gpt-3.5-turbo-0125' },
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
  { label: 'summarize-xlarge', value: 'summarize-xlarge' },
  { label: 'command-nightly', value: 'command-nightly' },
  { label: 'grok-2-latest', value: 'grok-2-latest' },
  { label: 'grok-2', value: 'grok-2' },
];
export const SUMMARIZE_STATIC_LANGUAGES: Option[] = [
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Modern Greek (1453-)', value: 'el' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Auto detection', value: 'auto-detect' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
];
export const LANGUAGE_DETECTION_STATIC_PROVIDERS: Option[] = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'ModernMT', value: 'modernmt' },
  { label: 'NeuralSpace', value: 'neuralspace' },
  { label: 'OneAI', value: 'oneai' },
  { label: 'OpenAI', value: 'openai' },
];
export async function getImageGenerationProviders() { return IMAGE_GENERATION_STATIC_PROVIDERS; }
export async function getImageGenerationModels() { return IMAGE_GENERATION_STATIC_MODELS; }
export async function getImageGenerationResolutions() { return IMAGE_GENERATION_STATIC_RESOLUTIONS; }
export async function getSpellCheckProviders() { return SPELL_CHECK_STATIC_PROVIDERS; }
export async function getSpellCheckModels() { return SPELL_CHECK_STATIC_MODELS; }
export async function getSpellCheckLanguages() { return SPELL_CHECK_STATIC_LANGUAGES; }
export async function getSummarizeProviders() { return SUMMARIZE_STATIC_PROVIDERS; }
export async function getSummarizeModels() { return SUMMARIZE_STATIC_MODELS; }
export async function getSummarizeLanguages() { return SUMMARIZE_STATIC_LANGUAGES; }
export async function getLanguageDetectionProviders() { return LANGUAGE_DETECTION_STATIC_PROVIDERS; }
export function normalizeImageGeneration(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    url: item.url || item.image_url || item.imageUrl,
    base64: item.base64,
    prompt: item.prompt,
    model: item.model,
    resolution: item.resolution,
    provider: item.provider || provider,
    raw: item,
  }));
}
export function normalizeSpellCheck(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    original: item.original || item.text,
    corrected: item.corrected || item.suggestion || item.suggestions,
    offset: item.offset,
    length: item.length,
    type: item.type,
    confidence: item.confidence,
    provider: item.provider || provider,
    raw: item,
  }));
}
export function normalizeSummarize(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    summary: item.summary,
    sentences: item.sentences,
    language: item.language,
    model: item.model,
    provider: item.provider || provider,
    raw: item,
  }));
}
export function normalizeLanguageDetection(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    language: item.language || item.language_code,
    display_name: item.display_name,
    confidence: item.confidence,
    is_reliable: item.isReliable || item.is_reliable,
    score: item.score,
    provider: item.provider || provider,
  }));
}

export const MODERATION_STATIC_PROVIDERS: Option[] = [
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google', value: 'google' },
];

export const MODERATION_STATIC_LANGUAGES: Option[] = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Italian', value: 'it' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Russian', value: 'ru' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Auto detection', value: 'auto-detect' },
];

export async function getModerationProviders() { return MODERATION_STATIC_PROVIDERS; }
export async function getModerationLanguages() { return MODERATION_STATIC_LANGUAGES; }

export function normalizeModeration(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    flagged: item.flagged,
    categories: item.categories,
    category_scores: item.category_scores,
    language: item.language,
    provider: item.provider || provider,
    raw: item,
  }));
}

export const TEXT_TO_SPEECH_STATIC_PROVIDERS: Option[] = [
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'IBM', value: 'ibm' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'ElevenLabs', value: 'elevenlabs' },
  { label: 'WellSaid', value: 'wellsaid' },
  { label: 'PlayHT', value: 'playht' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'XAI', value: 'xai' },
];

export const TEXT_TO_SPEECH_STATIC_LANGUAGES: Option[] = [
  { label: 'English (United States)', value: 'en-US' },
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'German (Germany)', value: 'de-DE' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Italian (Italy)', value: 'it-IT' },
  { label: 'Japanese (Japan)', value: 'ja-JP' },
  { label: 'Korean (South Korea)', value: 'ko-KR' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Hindi (India)', value: 'hi-IN' },
  { label: 'Auto detection', value: 'auto-detect' },
];

export const TEXT_TO_SPEECH_STATIC_VOICES: Option[] = [
  { label: 'Default', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export async function getTextToSpeechProviders() { return TEXT_TO_SPEECH_STATIC_PROVIDERS; }
export async function getTextToSpeechLanguages() { return TEXT_TO_SPEECH_STATIC_LANGUAGES; }
export async function getTextToSpeechVoices() { return TEXT_TO_SPEECH_STATIC_VOICES; }

export function normalizeTextToSpeech(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    audio_url: item.audio_url || item.url,
    base64: item.audio_base64 || item.base64,
    voice: item.voice,
    language: item.language,
    text: item.text,
    provider: item.provider || provider,
    raw: item,
  }));
}

export const OCR_EXTRACTION_STATIC_PROVIDERS: Option[] = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Base64', value: 'base64' },
];

export async function getOcrExtractionProviders() { return OCR_EXTRACTION_STATIC_PROVIDERS; }

export function normalizeOcrExtraction(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    text: item.text,
    blocks: item.blocks,
    provider: item.provider || provider,
    raw: item,
  }));
}

export const NER_STATIC_PROVIDERS: Option[] = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Tenstorrent', value: 'tenstorrent' },
  { label: 'XAI', value: 'xai' },
];

export const NER_STATIC_LANGUAGES: Option[] = [
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Auto detection', value: 'auto-detect' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Chinese (Traditional)', value: 'zh-Hant' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
];

export async function getNerProviders() { return NER_STATIC_PROVIDERS; }
export async function getNerLanguages() { return NER_STATIC_LANGUAGES; }

export function normalizeNer(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    entity: item.entity,
    type: item.type,
    start: item.start,
    end: item.end,
    confidence: item.confidence,
    provider: item.provider || provider,
    raw: item,
  }));
} 