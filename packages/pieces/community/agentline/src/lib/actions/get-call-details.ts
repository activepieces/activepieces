import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const getCallDetails = createAction({
  auth: agentlineAuth,
  name: 'get_call_details',
  displayName: 'Get Call Details',
  description: 'Get full details of a specific call including status and metadata',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the full details of a specific call by its ID, including status, phone numbers, timestamps, and duration.',
    idempotent: true,
  },
  props: {
    call_id: Property.ShortText({
      displayName: 'Call ID',
      description: 'The call ID to look up (e.g. call_xxx)',
      required: true,
    }),
  },
  async run(context) {
    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.GET,
      `/v1/calls/${context.propsValue.call_id}`,
    );
    return response.body;
  },
});
