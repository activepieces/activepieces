import { Property } from '@activepieces/pieces-framework';

// Language options for source_lang
export const sourceLangOptions = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'German', value: 'de' },
  { label: 'Greek', value: 'el' },
  { label: 'Spanish', value: 'es' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Norwegian', value: 'nb' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Chinese', value: 'zh' },
];

// Language options for target_lang
export const targetLangOptions = [
  { label: 'Arabic', value: 'ar' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'German', value: 'de' },
  { label: 'Greek', value: 'el' },
  { label: 'English (US)', value: 'en-us' },
  { label: 'English (UK)', value: 'en-gb' },
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Norwegian', value: 'nb' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese (Brazil)', value: 'pt-br' },
  { label: 'Portuguese (Portugal)', value: 'pt-pt' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Chinese (Simplified)', value: 'zh' },
];

// Model options
export const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4-1', value: 'gpt-4-1' },
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'o1 Mini', value: 'o1-mini' },
  { label: 'o1 Preview', value: 'o1-preview' },
  { label: 'o1', value: 'o1' },
  { label: 'o3 Mini', value: 'o3-mini' },
  { label: 'o3', value: 'o3' },
  { label: 'o4 Mini', value: 'o4-mini' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet' },
  { label: 'Claude 3.7 Sonnet Thinking', value: 'claude-3-7-sonnet-thinking' },
  { label: 'Claude 4 Sonnet', value: 'claude-4-sonnet' },
  { label: 'Claude 4 Sonnet Thinking', value: 'claude-4-sonnet-thinking' },
  { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku' },
  { label: 'Mistral Small', value: 'mistral-small' },
  { label: 'Mistral Large', value: 'mistral-large' },
  { label: 'DeepSeek R1', value: 'deepseek-r1' },
  { label: 'Kimi K2', value: 'kimi-k2' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2-0-flash' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2-5-pro' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2-5-flash' },
  { label: 'Gemini 2.5 Flash Thinking', value: 'gemini-2-5-flash-thinking' },
  { label: 'Grok 2', value: 'grok-2' },
  { label: 'Grok 4', value: 'grok-4' },
];

// Formality options
export const formalityOptions = [
  { label: 'Default', value: 'default' },
  { label: 'More Formal', value: 'more' },
  { label: 'Less Formal', value: 'less' },
  { label: 'Prefer More Formal', value: 'prefer_more' },
  { label: 'Prefer Less Formal', value: 'prefer_less' },
];

// Source Language Dropdown Property
export const sourceLangProperty = Property.StaticDropdown({
  displayName: 'Source Language',
  description: 'The language of the source text',
  required: false,
  defaultValue: 'en',
  options: {
    options: sourceLangOptions,
  },
});

// Target Language Dropdown Property
export const targetLangProperty = Property.StaticDropdown({
  displayName: 'Target Language',
  description: 'The language which the text should be generated in',
  required: false,
  options: {
    options: targetLangOptions,
  },
});

// Model Dropdown Property
export const modelProperty = Property.StaticDropdown({
  displayName: 'Model',
  description: 'The language model to use',
  required: false,
  defaultValue: 'gemini-2-0-flash',
  options: {
    options: modelOptions,
  },
});

// Formality Dropdown Property
export const formalityProperty = Property.StaticDropdown({
  displayName: 'Formality',
  description: 'The formality of the generated text, for languages that support it',
  required: false,
  defaultValue: 'default',
  options: {
    options: formalityOptions,
  },
});
