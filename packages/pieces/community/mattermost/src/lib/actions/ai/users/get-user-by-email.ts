import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserByEmailOutputSchema } from '../../../output-schemas';

export const getUserByEmailAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_by_email',
  outputSchema: mattermostGetUserByEmailOutputSchema,
  displayName: 'Get User By Email',
  description: 'Gets a user by email address.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one user\'s profile, including the user ID other actions take, from their exact email address. Fails when the server hides emails from the connected user; Search Users matches part of an email.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Exact email address of the user.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/email/${encodeURIComponent(context.propsValue.email)}`,
    });
  },
});
