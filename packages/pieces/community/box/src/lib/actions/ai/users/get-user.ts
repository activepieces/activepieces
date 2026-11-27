import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getUserAction = createAction({
  auth: boxAuth,
  name: 'box_get_user',
  displayName: 'Get User',
  description: 'Gets a Box user by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one enterprise user: name, login, role, status and storage; needs admin rights for users other than yourself. Get the ID from List Users or Get Current User.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(propsValue.userId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
