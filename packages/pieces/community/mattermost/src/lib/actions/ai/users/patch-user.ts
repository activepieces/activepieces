import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateUserOutputSchema } from '../../../output-schemas';

export const patchUserAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_patch_user',
  outputSchema: mattermostCreateUserOutputSchema,
  displayName: 'Update User',
  description: 'Updates fields of a user\'s profile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the profile fields given (email, username, names, nickname, position, locale) and leaves the rest. Updating another user needs permission to edit other users. For roles use Update User Roles, for the picture Set User Image.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New email address.',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'New unique username: lowercase letters, numbers, ".", "-" and "_".',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'New first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'New last name.',
      required: false,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'New nickname.',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'New job title or position.',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'New interface language code, e.g. "en" or "de".',
      required: false,
    }),
  },
  async run(context) {
    const { userId, email, username, firstName, lastName, nickname, position, locale } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/patch`,
      body: {
        ...(email !== undefined ? { email } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(firstName !== undefined ? { first_name: firstName } : {}),
        ...(lastName !== undefined ? { last_name: lastName } : {}),
        ...(nickname !== undefined ? { nickname } : {}),
        ...(position !== undefined ? { position } : {}),
        ...(locale !== undefined ? { locale } : {}),
      },
    });
  },
});
