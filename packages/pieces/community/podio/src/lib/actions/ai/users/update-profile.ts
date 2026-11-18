import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_update_profile',
  displayName: 'Update Profile',
  description: 'Updates fields of the connected user\'s profile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates the given fields of the connected user\'s own contact profile; fields not named are left unchanged and a field set to null is cleared. Field keys are those returned by Get Profile. For one field use Update Profile Field.',
    idempotent: true,
  },
  props: {
    fields: podioAiProps.json({
      required: true,
      displayName: 'Fields',
      description: 'An object mapping profile field keys to a value or list of values, e.g. {"title": ["Manager"], "phone": ["+4512345678"]}. Set a field to null to clear it.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: '/user/profile/', body: propsValue.fields });
  },
});
