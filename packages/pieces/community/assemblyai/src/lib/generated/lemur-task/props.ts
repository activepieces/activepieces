import { Property } from '@activepieces/pieces-framework';
export const props = {
  prompt: Property.ShortText({
    displayName: 'Prompt',
    required: true,
    description:
      'Your text to prompt the model to produce a desired output, including any context you want to pass into the model.',
  }),
  transcript_ids: Property.Array({
    displayName: 'Transcript IDs',
    required: false,
    description:
      'A list of completed transcripts with text. Up to a maximum of 100 files or 100 hours, whichever is lower.\nUse either transcript_ids or input_text as input into LeMUR.\n',
  }),
  input_text: Property.ShortText({
    displayName: 'Input Text',
    required: false,
    description:
      'Custom formatted transcript data. Maximum size is the context limit of the selected model, which defaults to 100000.\nUse either transcript_ids or input_text as input into LeMUR.\n',
  }),
  context: Property.LongText({
    displayName: 'Context',
    required: false,
    description:
      'Context to provide the model. This can be a string or a free-form JSON value.',
  }),
  final_model: Property.StaticDropdown({
    displayName: 'Final Model',
    required: false,
    description:
      'The model that is used for the final prompt after compression is performed.\n',
    options: {
      options: [
        {
          label: 'Claude 3.5 Sonnet (on Anthropic)',
          value: 'anthropic/claude-3-5-sonnet',
        },
        {
          label: 'Claude 3 Opus (on Anthropic)',
          value: 'anthropic/claude-3-opus',
        },
        {
          label: 'Claude 3 Haiku (on Anthropic)',
          value: 'anthropic/claude-3-haiku',
        },
        {
          label: 'Claude 3 Sonnet (on Anthropic)',
          value: 'anthropic/claude-3-sonnet',
        },
        {
          label: 'Claude 2.1 (on Anthropic)',
          value: 'anthropic/claude-2-1',
        },
        {
          label: 'Claude 2 (on Anthropic)',
          value: 'anthropic/claude-2',
        },
        {
          label: 'Default',
          value: 'default',
        },
        {
          label: 'Claude Instant 1.2 (on Anthropic)',
          value: 'anthropic/claude-instant-1-2',
        },
        {
          label: 'Basic',
          value: 'basic',
        },
        {
          label: 'Mistral 7B (Hosted by AssemblyAI)',
          value: 'assemblyai/mistral-7b',
        },
      ],
    },
  }),
  max_output_size: Property.Number({
    displayName: 'Maximum Output Size',
    required: false,
    description: 'Max output size in tokens, up to 4000',
  }),
  temperature: Property.Number({
    displayName: 'Temperature',
    required: false,
    description:
      'The temperature to use for the model.\nHigher values result in answers that are more creative, lower values are more conservative.\nCan be any value between 0.0 and 1.0 inclusive.\n',
  }),
};
