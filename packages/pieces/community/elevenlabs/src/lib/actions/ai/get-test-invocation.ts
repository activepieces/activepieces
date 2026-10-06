import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetTestInvocationOutputSchema } from '../../output-schemas';

export const getTestInvocation = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_test_invocation',
  outputSchema: elevenlabsGetTestInvocationOutputSchema,
  displayName: 'Get Test Invocation',
  description: 'Get the results of a test run',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a test invocation with the result of each test run. Poll this after Run Agent Tests.',
    idempotent: true,
  },
  props: {
    testInvocationId: Property.ShortText({ displayName: 'Test Invocation ID', description: 'The id from Run Agent Tests or List Test Invocations', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/test-invocations/${encodeURIComponent(propsValue.testInvocationId)}`,
    });
    return response ?? { success: true };
  },
});
