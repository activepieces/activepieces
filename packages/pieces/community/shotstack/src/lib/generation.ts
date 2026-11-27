import { Property, tryCatch } from '@activepieces/pieces-framework';
import { shotstackAuth } from './auth';
import { shotstackApi } from './common';

export const generationProps = {
  asset_type: Property.StaticDropdown({
    displayName: 'Asset Type',
    description: 'The kind of file to generate. It decides which models the Model list shows.',
    required: true,
    defaultValue: 'image',
    options: {
      disabled: false,
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
      ],
    },
  }),
  prompt: Property.LongText({
    displayName: 'Prompt',
    description:
      'What to generate, for example "A lighthouse on a rocky coast at sunset, cinematic lighting". For a text-to-speech model, the words to speak.',
    required: true,
  }),
  model: Property.Dropdown({
    auth: shotstackAuth,
    displayName: 'Model',
    description:
      "Leave empty for Shotstack's default model for this asset type. The list comes from your account, so new models show up on their own.",
    required: false,
    refreshers: ['asset_type'],
    options: async ({ auth, asset_type }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Shotstack account first' };
      }
      const { data: models, error } = await tryCatch(() => shotstackApi.listModels({ connection: auth.props }));
      if (error) {
        return { disabled: true, options: [], placeholder: error.message };
      }
      const options = models
        .flatMap((m) =>
          m.model && m.available !== false && (!asset_type || m.type === asset_type)
            ? [{ label: m.name || m.model, value: m.model }]
            : [],
        )
        .sort((a, b) => a.label.localeCompare(b.label));
      if (options.length === 0) {
        return { disabled: true, options: [], placeholder: 'Your plan has no models for this asset type' };
      }
      return { disabled: false, options };
    },
  }),
  model_options: Property.Json({
    displayName: 'Model Options',
    description:
      'Optional settings for the chosen model, for example {"aspectRatio": "16:9"}. List Generation Models shows what each model accepts. Leave empty for its defaults.',
    required: false,
  }),
  length: Property.Number({
    displayName: 'Clip Length (Seconds)',
    description: 'Only read by models that generate to a duration, for example 5. Leave empty for the model default.',
    required: false,
  }),
};
