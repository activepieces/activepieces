import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const getCallDetails = createAction({
  auth: blandAiAuth,
  name: 'get_call_details',
  displayName: 'Get Call Details',
  description: 'Retrieve details for a specific Bland AI call.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the full record of one Bland AI call by its call ID (status, transcript, summary, recording URL, and post-call data). Use to inspect or poll the outcome of a call after it has been placed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The Bland AI call identifier.',
      required: true,
    }),
  },
  async run(context) {
    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/calls/${encodeURIComponent(context.propsValue.callId)}`,
    });
  },
});
