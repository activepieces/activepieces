import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const setUserPropertyAction = createAction({
  auth: podioAuth,
  name: 'podio_set_user_property',
  displayName: 'Set User Property',
  description: 'Sets a stored property of the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stores one named property on the connected user, replacing its current value; the value is a JSON object. Properties are private to this connection\'s OAuth client; read one back with Get User Property.',
    idempotent: true,
  },
  props: {
    name: podioAiProps.text({ required: true, displayName: 'Property Name', description: 'The name of the property. Properties belong to this connection\'s OAuth client.' }),
    value: podioAiProps.json({ required: true, displayName: 'Value', description: 'The JSON object to store as the property value.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/user/property/${propsValue.name}`, body: propsValue.value });
  },
});
