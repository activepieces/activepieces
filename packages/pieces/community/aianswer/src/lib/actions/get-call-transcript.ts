import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { aiAnswerAuth } from '../..';
import { aiAnswerConfig } from '../common/models';

export const getCallTranscript = createAction({
  name: 'getCallTranscript',
  auth: aiAnswerAuth,  // Auth configured here
  displayName: 'Get Call Transcript',
  description: 'Fetch the transcript of a call by Call ID',
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
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth,
      },
    });

    return res.body;
  },
});
