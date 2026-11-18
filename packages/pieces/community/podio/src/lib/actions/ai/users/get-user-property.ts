import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetUserPropertyOutputSchema } from '../../../output-schemas';

export const getUserPropertyAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_property',
  outputSchema: podioGetUserPropertyOutputSchema,
  displayName: 'Get User Property',
  description: 'Gets the value of a stored property of the connected user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the JSON value of one named property stored on the connected user with Set User Property or Set User Properties; properties are private to this connection\'s OAuth client. Get User Status lists all of them.',
    idempotent: true,
  },
  props: {
    name: podioAiProps.text({ required: true, displayName: 'Property Name', description: 'The name of the property. Properties belong to this connection\'s OAuth client.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/user/property/${propsValue.name}` });
  },
});
