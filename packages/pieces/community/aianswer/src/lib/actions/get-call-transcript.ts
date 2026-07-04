import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { aiAnswerAuth } from '../auth';
import { aiAnswerConfig } from '../common/models';

export const getCallTranscript = createAction({
  name: 'getCallTranscript',
  auth: aiAnswerAuth,  // Auth configured here
  displayName: 'Get Call Transcript',
  description: 'Fetch the transcript of a call by Call ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the conversation transcript of a completed phone call by its call ID. Use to read what was said on a call after it has finished. Requires the call ID; read-only and idempotent.', idempotent: true },
  props: {
    callID: Property.ShortText({
      displayName: 'Call ID',
      required: true,
    }),
  },
  async run(context) {
    const callID = context.propsValue.callID;

    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${aiAnswerConfig.baseUrl}/v2/get_transcript/${callID}`,
      headers: {
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth.secret_text,
      },
    });

    return res.body;
  },
});
