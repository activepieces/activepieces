import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createEmailAliasAction = createAction({
  auth: boxAuth,
  name: 'box_create_email_alias',
  displayName: 'Create Email Alias',
  description: 'Adds an email alias to a Box user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an extra email address to a user and returns the alias with its ID. Aliases on a domain the enterprise has not verified stay unconfirmed until the user confirms them. Get the user ID from List Users.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'The email address to add.', required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(propsValue.userId)}/email_aliases`,
      body: { email: propsValue.email },
    });
  },
});
