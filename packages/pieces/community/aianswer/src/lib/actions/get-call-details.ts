import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { aiAnswerAuth } from '../auth';
import { aiAnswerConfig } from '../common/models';

export const getCallDetails = createAction({
  name: 'getCallDetails',
  auth: aiAnswerAuth,
  displayName: 'Get Call Details',
  description: 'Fetch Call details by Call ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the details and status of a single phone call by its call ID. Use to check the outcome or metadata of a call previously created or scheduled. Requires the call ID; read-only and idempotent.', idempotent: true },
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
      url: `${aiAnswerConfig.baseUrl}/v2/get_call/${callID}`,
      headers: {
        [aiAnswerConfig.accessTokenHeaderKey]: context.auth.secret_text,
      },
    });

    return res.body;
  },
});
