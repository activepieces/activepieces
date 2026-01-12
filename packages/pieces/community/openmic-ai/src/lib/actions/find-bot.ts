import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const findBot = createAction({
  auth: openmicAiAuth,
  name: 'findBot',
  displayName: 'Find Bot',
  description: 'Retrieve details of a specific bot by its UID',
  props: {
    uid: Property.ShortText({
      displayName: 'Bot UID',
      description: 'The unique identifier of the bot',
      required: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/bots/${context.propsValue.uid}`
    );

    return response.body;
  },
});
