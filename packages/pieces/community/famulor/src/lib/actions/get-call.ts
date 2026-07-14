import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCall = createAction({
  auth: famulorAuth,
  name: 'getCall',
  displayName: 'Get Call',
  description: 'Retrieve details for a call by ID, including transcript and recording.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the full details of a single call by its numeric ID, including transcript and recording. Use when you already have a call ID and need its content; to discover or filter calls first use List Calls. Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.getCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getCallSchema);

    return await famulorCommon.getCall({
      auth: auth.secret_text,
      call_id: propsValue.call_id as number,
    });
  },
});
