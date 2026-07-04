import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const findCall = createAction({
  auth: openmicAiAuth,
  name: 'findCall',
  displayName: 'Find Call',
  description: 'Retrieve details of a specific call by its ID',
  audience: 'both',
  aiMetadata: { description: 'Fetches the full details of a single OpenMic AI call by its call ID. Use when you already have a call ID and need its record; to discover IDs or browse calls, use Get Calls instead. Read-only and idempotent.', idempotent: true },
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call',
      required: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/call/${context.propsValue.callId}`
    );

    return response;
  },
});
