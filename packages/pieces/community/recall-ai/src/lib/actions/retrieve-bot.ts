import { createAction, Property } from '@activepieces/pieces-framework';
import { recallAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const retrieveBot = createAction({
  auth: recallAiAuth,
  name: 'retrieveBot',
  displayName: 'Retrieve Bot',
  description: 'Get details about a specific bot instance',
  props: {
    bot_id: Property.ShortText({
      displayName: 'Bot ID',
      description: 'A UUID string identifying the bot',
      required: true,
    }),
  },
  async run(context) {
    const { bot_id } = context.propsValue;

    const response =  await makeRequest(
      context.auth.props.server,
      context.auth.props.api_key,
      HttpMethod.GET,
      `/bot/${bot_id}`,
      {}
    );

    return response;
  },
});
