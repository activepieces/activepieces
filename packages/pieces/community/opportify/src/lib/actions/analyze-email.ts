import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { opportifyAuth } from '../common/auth';

export const analyzeEmailAction = createAction({
  displayName: 'Analyze Email',
  name: 'analyze-email',
  description:
    'Validates an email address and returns its deliverability status.',
  audience: 'both',
  aiMetadata: {
    description:
      'Validates a single email address via the Opportify API and reports its deliverability, with optional auto-correction of likely typos and optional AI-assisted analysis. Use when an agent needs to verify whether an email is valid or deliverable before sending or storing it. Requires the email string; this is a read-only lookup and is safe to repeat.',
    idempotent: true,
  },
  auth: opportifyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    enableAutoCorrection: Property.Checkbox({
      displayName: 'Enable Auto Correction?',
      required: false,
    }),
    enableAI: Property.Checkbox({
      displayName: 'Enable AI?',
      required: false,
    }),
  },
  async run(context) {
    const { email, enableAI, enableAutoCorrection } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.opportify.ai/insights/v1/email/analyze',
      headers: {
        'x-opportify-token': context.auth.secret_text,
      },
      body: {
        email,
        enableAI,
        enableAutoCorrection,
      },
    });

    return response.body;
  },
});
