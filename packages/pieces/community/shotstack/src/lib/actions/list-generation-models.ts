import { createAction } from '@activepieces/pieces-framework';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';

export const listGenerationModels = createAction({
  auth: shotstackAuth,
  name: 'list_generation_models',
  classification: 'SEARCH',
  displayName: 'List Generation Models',
  description: 'Lists the AI models your account can generate with, and the options each one accepts.',
  audience: 'both',
  aiMetadata: {
    description:
      "List the AI generation models this Shotstack account can use, with each model's type (image, video or audio), availability and the JSON Schema of the options it accepts. Call before Generate Asset or Quote Generation so the model and options you send exist. Safe to retry.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return shotstackApi.listModels({ connection: auth.props });
  },
});
