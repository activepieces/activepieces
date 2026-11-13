import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const setUserPropertiesAction = createAction({
  auth: podioAuth,
  name: 'podio_set_user_properties',
  displayName: 'Set User Properties',
  description: 'Sets one or more stored properties of the connected user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stores several named properties on the connected user at once, each value a JSON object; properties not named are kept. Properties are private to this connection\'s OAuth client. For a single one use Set User Property.',
    idempotent: true,
  },
  props: {
    properties: podioAiProps.json({ required: true, displayName: 'Properties', description: 'An object mapping each property name to its JSON object value, e.g. {"theme": {"dark": true}}.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: '/user/property/', body: propsValue.properties });
  },
});
