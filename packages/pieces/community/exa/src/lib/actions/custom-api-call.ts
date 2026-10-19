import { createAction } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { exaAuth } from '../auth';
import { BASE_URL, exaApi } from '../common/client';

const baseAction = createCustomApiCallAction({
  auth: exaAuth,
  baseUrl: () => BASE_URL,
  authMapping: async (auth, propsValue) => {
    exaApi.assertExaUrl(propsValue['url']?.['url']);
    if (propsValue['followRedirects'] === true) {
      throw new Error('Follow redirects is not supported for Exa: a redirect could carry your API key to another host.');
    }
    return { 'x-api-key': auth.secret_text };
  },
});

export const exaCustomApiCallAction = createAction({
  auth: exaAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom API call to a specific endpoint',
  props: baseAction.props,
  requireAuth: baseAction.requireAuth,
  errorHandlingOptions: baseAction.errorHandlingOptions,
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends an authenticated request to any Exa API path on https://api.exa.ai, for endpoints the other Exa actions do not cover. Takes a relative path or a full api.exa.ai URL, a method, headers, query parameters and an optional body, and returns the HTTP status, headers and body. Not idempotent in general: POST and DELETE change Exa state.',
    idempotent: false,
  },
  run: async (context) =>
    baseAction.run({
      ...context,
      propsValue: { ...context.propsValue, followRedirects: context.propsValue.followRedirects ?? false },
    }),
});
