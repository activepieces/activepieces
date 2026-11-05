import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteUserPropertyAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_user_property',
  displayName: 'Delete User Property',
  description: 'Deletes a stored property of the connected user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one named property stored on the connected user; properties are key/value data private to this connection\'s OAuth client, set with Set User Property. Read the current value first with Get User Property if it may be needed again.',
    idempotent: false,
  },
  props: {
    name: podioAiProps.text({ required: true, displayName: 'Property Name', description: 'The name of the property. Properties belong to this connection\'s OAuth client.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/user/property/${propsValue.name}` });
  },
});
