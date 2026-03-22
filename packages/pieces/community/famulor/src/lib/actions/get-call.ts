import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCall = createAction({
  auth: famulorAuth,
  name: 'getCall',
  displayName: 'Get Call',
  description:
    'Retrieve full details for a single call by ID (transcript, variables, costs, recording URL, etc.).',
  props: famulorCommon.getCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getCallSchema);

    return await famulorCommon.getCall({
      auth: auth.secret_text,
      call_id: propsValue.call_id as number,
    });
  },
});
