import { createAction, Property } from '@activepieces/pieces-framework';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';

export const getGenerationStatus = createAction({
  auth: shotstackAuth,
  name: 'get_generation_status',
  classification: 'READ',
  displayName: 'Get Generation Status',
  description: 'Gets the status of a generation and, once it is done, its file URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the status (queued, processing, done or failed) and, when done, the file URL of a Shotstack AI generation by its ID. Use after Generate Asset ran without waiting. Safe to retry.',
    idempotent: true,
  },
  props: {
    generation_id: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The ID a Generate Asset step returned, for example 8a1f2c3d-4e5b-5a6c-9d7e-1f2a3b4c5d6e.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { body } = await shotstackApi.getGeneration({ connection: auth.props, id: propsValue.generation_id.trim() });
    return shotstackApi.generationSummary(body);
  },
});
