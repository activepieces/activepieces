import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const deleteCall = createAction({
  auth: famulorAuth,
  name: 'deleteCall',
  displayName: 'Delete Call',
  description: 'Permanently delete a call record including its transcript and recording.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete a single call record (transcript and recording included) by its numeric call ID. Use only when a caller explicitly wants a call purged; this is destructive and cannot be undone. Repeating the call on an already-deleted ID will not restore data, so treat it as non-idempotent.',
    idempotent: false,
  },
  props: famulorCommon.deleteCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.deleteCallSchema);

    return await famulorCommon.deleteCall({
      auth: auth.secret_text,
      call_id: propsValue.call_id as number,
    });
  },
});
