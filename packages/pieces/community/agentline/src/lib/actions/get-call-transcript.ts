import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const getCallTranscript = createAction({
  auth: agentlineAuth,
  name: 'get_call_transcript',
  displayName: 'Get Call Transcript',
  description: 'Get the full conversation transcript for a completed call',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the complete transcript of a voice call as an array of turns with role, text, and timestamp. The call must be completed first.',
    idempotent: true,
  },
  props: {
    call_id: Property.ShortText({
      displayName: 'Call ID',
      description: 'The call ID to get the transcript for',
      required: true,
    }),
  },
  async run(context) {
    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.GET,
      `/v1/calls/${context.propsValue.call_id}/transcript`,
    );
    return response.body;
  },
});
