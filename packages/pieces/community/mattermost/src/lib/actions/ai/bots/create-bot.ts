import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostAssignBotOutputSchema } from '../../../output-schemas';

export const createBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_bot',
  outputSchema: mattermostAssignBotOutputSchema,
  displayName: 'Create Bot',
  description: 'Creates a bot account.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new bot account owned by the connected user. Needs bot account creation enabled on the server and a connection that is not itself a bot. Not idempotent: a taken username fails.',
    idempotent: false,
  },
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Unique bot username: lowercase letters, numbers, ".", "-" and "_".',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Name shown for the bot.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'What the bot is for.',
      required: false,
    }),
  },
  async run(context) {
    const { username, displayName, description } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/bots',
      body: { username, display_name: displayName, description },
    });
  },
});
