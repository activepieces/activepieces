import { Property } from '@activepieces/pieces-framework';
export const props = {
  prompt: Property.ShortText({
    displayName: 'Prompt',
    required: true,
    description:
      'What you want the model to do with the transcripts.',
    placeholder: 'Summarize the action items from this call.',
  }),
  transcript_ids: Property.Array({
    displayName: 'Transcript IDs',
    required: false,
    description:
      'Completed transcripts to use, up to 100 files or 100 hours.',
  }),
  input_text: Property.ShortText({
    displayName: 'Input Text',
    required: false,
    description:
      'Your own text to use instead of transcripts.',
  }),
  context: Property.LongText({
    displayName: 'Context',
    required: false,
    description:
      'Background the model should know, as text or JSON.',
  }),
  final_model: Property.StaticDropdown({
    displayName: 'Model',
    required: false,
    description:
      'Empty uses the default model.',
    options: {
      options: [
        {
          label: 'Claude 3.5 Sonnet',
          value: 'anthropic/claude-3-5-sonnet',
        },
        {
          label: 'Claude 3 Opus',
          value: 'anthropic/claude-3-opus',
        },
        {
          label: 'Claude 3 Haiku',
          value: 'anthropic/claude-3-haiku',
        },
        {
          label: 'Claude 3 Sonnet',
          value: 'anthropic/claude-3-sonnet',
        },
        {
          label: 'Claude 2.1',
          value: 'anthropic/claude-2-1',
        },
        {
          label: 'Claude 2',
          value: 'anthropic/claude-2',
        },
        {
          label: 'Default',
          value: 'default',
        },
        {
          label: 'Claude Instant 1.2',
          value: 'anthropic/claude-instant-1-2',
        },
        {
          label: 'Basic',
          value: 'basic',
        },
        {
          label: 'Mistral 7B',
          value: 'assemblyai/mistral-7b',
        },
      ],
    },
  }),
  max_output_size: Property.Number({
    displayName: 'Max Output Size',
    required: false,
    description: 'Longest answer in tokens, up to 4000.',
    display: 'stepper',
    min: 1,
    max: 4000,
    step: 100,
  }),
  temperature: Property.Number({
    displayName: 'Temperature',
    required: false,
    description:
      'From 0 to 1. Higher gives more creative answers.',
  }),
};
