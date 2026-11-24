import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostConvertBotToUserOutputSchema } from '../../../output-schemas';

export const convertBotToUserAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_convert_bot_to_user',
  outputSchema: mattermostConvertBotToUserOutputSchema,
  displayName: 'Convert Bot to User',
  description: 'Turns a bot account into a regular user account.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Turns a bot into a regular user account that signs in with the given email and password; the bot record is removed. Takes the bot\'s user ID from Create Bot or List Bots. Needs a system admin connection. Not idempotent: once converted the bot no longer exists.',
    idempotent: false,
  },
  props: {
    botUserId: Property.ShortText({
      displayName: 'Bot User ID',
      description: 'The bot\'s user ID (26 characters). Use Create Bot or List Bots to find it.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for the new user account.',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the new user account; must meet the server\'s password rules.',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'New username. Defaults to the bot\'s username.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the user.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the user.',
      required: false,
    }),
    setSystemAdmin: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Make System Admin',
      description: '"true" to give the new user the system admin role. Defaults to "false".',
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const systemAdmin = mattermostUtils.parseBoolean({ value: p.setSystemAdmin });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/bots/${encodeURIComponent(p.botUserId)}/convert_to_user`,
      redactBodyInErrors: true,
      query: systemAdmin !== undefined ? { set_system_admin: String(systemAdmin) } : undefined,
      body: {
        email: p.email,
        password: p.password,
        username: p.username,
        first_name: p.firstName,
        last_name: p.lastName,
      },
    });
  },
});
