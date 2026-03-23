import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const deleteCall = createAction({
  auth: famulorAuth,
  name: 'deleteCall',
  displayName: 'Delete Call',
  description: 'Permanently delete a call record including its transcript and recording.',
  props: famulorCommon.deleteCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.deleteCallSchema);

    return await famulorCommon.deleteCall({
      auth: auth.secret_text,
      call_id: propsValue.call_id as number,
    });
  },
});
