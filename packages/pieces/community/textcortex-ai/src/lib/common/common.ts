export const baseUrl = 'https://api.textcortex.com/v1';

export const unauthorizedMessage = `Error Occurred: 401 

Ensure that your API key is valid. You can get your API key from:
1. Sign up at https://textcortex.com
2. Go to account settings
3. Navigate to API Key section
`;

export const billingIssueMessage = `Error Occurred: 429 

1. Check your TextCortex account balance and usage limits
2. Upgrade your plan if needed
3. Wait for rate limits to reset
4. Try again

For guidance, visit: https://textcortex.com/pricing
`;

export const SOCIAL_MEDIA_PLATFORMS = [
  { label: 'Twitter', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
];

export const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Russian', value: 'ru' },
  { label: 'Polish', value: 'pl' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Danish', value: 'da' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Greek', value: 'el' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Chinese (Simplified)', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Thai', value: 'th' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Malay', value: 'ms' },
];

export const PROGRAMMING_LANGUAGES = [
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Go', value: 'go' },
  { label: 'PHP', value: 'php' },
  { label: 'JS Regex', value: 'js_regex' },
];

export const AI_MODELS = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4-1', value: 'gpt-4-1' },
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'o1-mini', value: 'o1-mini' },
  { label: 'o1-preview', value: 'o1-preview' },
  { label: 'o1', value: 'o1' },
  { label: 'o3-mini', value: 'o3-mini' },
  { label: 'o3', value: 'o3' },
  { label: 'o4-mini', value: 'o4-mini' },
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

export const FORMALITY_LEVELS = [
  { label: 'Default', value: 'default' },
  { label: 'More Formal', value: 'more' },
  { label: 'Less Formal', value: 'less' },
  { label: 'Prefer More Formal', value: 'prefer_more' },
  { label: 'Prefer Less Formal', value: 'prefer_less' },
];

export const CREATIVITY_LEVELS = [
  { label: 'Low (Conservative)', value: 'low' },
  { label: 'Medium (Balanced)', value: 'medium' },
  { label: 'High (Creative)', value: 'high' },
];

export const TONE_OPTIONS = [
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Friendly', value: 'friendly' },
  { label: 'Formal', value: 'formal' },
  { label: 'Informal', value: 'informal' },
  { label: 'Persuasive', value: 'persuasive' },
  { label: 'Engaging', value: 'engaging' },
  { label: 'Authoritative', value: 'authoritative' },
  { label: 'Conversational', value: 'conversational' },
  { label: 'Enthusiastic', value: 'enthusiastic' },
];

export const LENGTH_OPTIONS = [
  { label: 'Very Short', value: 'very_short' },
  { label: 'Short', value: 'short' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' },
  { label: 'Very Long', value: 'very_long' },
];

export const API_ENDPOINTS = {
  CODES: '/codes',
  EMAILS: '/texts/emails', 
  PARAPHRASES: '/texts/paraphrases',
  PRODUCT_DESCRIPTIONS: '/texts/products/descriptions',
  SOCIAL_MEDIA_POSTS: '/texts/social-media-posts',
  SUMMARIZATIONS: '/texts/summarizations',
  TRANSLATIONS: '/texts/translations',
  COMPLETIONS: '/texts/completions',
};

import { Property } from '@activepieces/pieces-framework';

export const createCommonProperties = () => ({
  model: Property.StaticDropdown({
    displayName: 'Model',
    description: 'AI model to use',
    required: false,
    defaultValue: 'gemini-2-0-flash',
    options: {
      options: AI_MODELS,
    },
  }),

  max_tokens: Property.Number({
    displayName: 'Max Tokens',
    description: 'Maximum tokens to generate',
    required: false,
    defaultValue: 2048,
  }),

  temperature: Property.Number({
    displayName: 'Temperature',
    description: 'Controls creativity (0.0-1.0)',
    required: false,
  }),

  n: Property.Number({
    displayName: 'Number of Outputs',
    description: 'Number of outputs to generate (1-5)',
    required: false,
    defaultValue: 1,
  }),

  source_lang: Property.StaticDropdown({
    displayName: 'Source Language',
    description: 'Language of the input text',
    required: false,
    defaultValue: 'auto',
    options: {
      options: [
        { label: 'Auto-detect', value: 'auto' },
        ...LANGUAGES,
      ],
    },
  }),

  target_lang: Property.StaticDropdown({
    displayName: 'Target Language',
    description: 'Language for the output',
    required: false,
    defaultValue: 'en',
    options: {
      options: LANGUAGES,
    },
  }),

  formality: Property.StaticDropdown({
    displayName: 'Formality Level',
    description: 'Desired formality of the output',
    required: false,
    defaultValue: 'default',
    options: {
      options: FORMALITY_LEVELS,
    },
  }),

  context: Property.LongText({
    displayName: 'Context',
    description: 'Additional context to guide generation',
    required: false,
  }),

  creativity: Property.StaticDropdown({
    displayName: 'Creativity Level',
    description: 'Controls creative approach',
    required: false,
    defaultValue: 'medium',
    options: {
      options: CREATIVITY_LEVELS,
    },
  }),

  tone: Property.StaticDropdown({
    displayName: 'Tone',
    description: 'Desired tone of the output',
    required: false,
    defaultValue: 'professional',
    options: {
      options: TONE_OPTIONS,
    },
  }),

  length: Property.StaticDropdown({
    displayName: 'Length',
    description: 'Desired length of the output',
    required: false,
    defaultValue: 'medium',
    options: {
      options: LENGTH_OPTIONS,
    },
  }),
});
