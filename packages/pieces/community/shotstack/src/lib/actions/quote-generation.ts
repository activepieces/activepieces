import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';
import { generationProps } from '../generation';

export const quoteGeneration = createAction({
  auth: shotstackAuth,
  name: 'quote_generation',
  classification: 'READ',
  displayName: 'Quote Generation',
  description: 'Estimates the credits a generation would cost. Spends nothing and starts no job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Estimate the credits Generate Asset would bill for the same asset type, model, prompt and options, without starting a job or spending anything. Use before Generate Asset when cost matters. Safe to retry.',
    idempotent: true,
  },
  props: generationProps,
  async run({ auth, propsValue }) {
    const { body } = await shotstackApi.send<Record<string, unknown>>({
      connection: auth.props,
      method: HttpMethod.POST,
      path: '/generate/quote',
      body: shotstackApi.generationBody(propsValue),
    });
    return body;
  },
});
