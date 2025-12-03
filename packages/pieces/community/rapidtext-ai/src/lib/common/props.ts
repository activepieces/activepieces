import { Property } from '@activepieces/pieces-framework';

export const modelDropdown = Property.StaticDropdown({
  displayName: 'Model',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
      { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
      { label: 'GPT-4', value: 'gpt-4' },
      { label: 'DeepSeek V3', value: 'deepseek-chat' },
      { label: 'GPT-4o', value: 'gpt-4o' },
      { label: 'Grok-2', value: 'grok-2' },
      { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
      { label: 'Gemini 2.0 Pro', value: 'gemini-2.0-pro' },
      { label: 'DeepSeek R1', value: 'deepseek-reasoner' },
    ],
  },
});
