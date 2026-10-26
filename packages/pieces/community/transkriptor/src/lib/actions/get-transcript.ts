import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';

export const getTranscriptAction = createAction({
  auth: transkriptorAuth,
  name: 'get_transcript',
  classification: 'READ',
  displayName: 'Get Transcript',
  description:
    'Retrieves the content of a finished transcription by its order ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full transcript content (text, speakers, timestamps, summary link) for a completed transcription by its order ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description:
        'The order ID returned by a Transcribe action or the Transcription Completed trigger.',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/files/${context.propsValue.orderId}/content`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    const body = response.body as Record<string, unknown>;
    const { folder_id, ...safeBody } = body;

    return safeBody;
  },
});
