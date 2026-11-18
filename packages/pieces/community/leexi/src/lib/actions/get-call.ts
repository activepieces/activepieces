import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiCall } from '../common/types';
import { leexiOutputFields } from '../common/constants';

export const getCallAction = createAction({
  name: 'get-call',
  classification: 'READ',
  auth: leexiAuth,
  displayName: 'Get Call',
  description: 'Gets call details.',
  audience: 'human',
  outputSchema: {
    fields: [
      {
        key: 'data',
        label: 'Call',
        children: leexiOutputFields.callDetail,
      },
    ],
  },
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The UUID of the Leexi call.',
      required: true,
    }),
  },
  async run(context) {
    return await leexiApi.request<{ data: LeexiCall }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['calls', context.propsValue.callId.trim()],
    });
  },
});
