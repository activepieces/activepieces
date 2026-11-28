import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiClient } from '../../../common/client';
import { cometapiGrokGetVideoOutputSchema } from '../../../output-schemas';

export const grokGetVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_grok_get_video',
  outputSchema: cometapiGrokGetVideoOutputSchema,
  displayName: 'Get Grok Video',
  description: 'Gets the status and result of a Grok video generation or edit.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the status, progress and, when done, the temporary video URL of a job started with Generate Grok Video or Edit Grok Video, which return the request_id. Reads once without waiting: call again later while status is pending or only request_id comes back; done, failed and expired are final.',
    idempotent: true,
  },
  props: {
    requestId: Property.ShortText({
      displayName: 'Request ID',
      description:
        'The request_id returned by Generate Grok Video or Edit Grok Video.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cometApiClient.request({
      auth,
      method: HttpMethod.GET,
      host: 'root',
      path: `/grok/v1/videos/${encodeURIComponent(propsValue.requestId)}`,
    });
  },
});
