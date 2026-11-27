import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteEmailAliasOutputSchema } from '../../../output-schemas';

export const deleteEmailAliasAction = createAction({
  auth: boxAuth,
  name: 'box_delete_email_alias',
  outputSchema: boxDeleteEmailAliasOutputSchema,
  displayName: 'Delete Email Alias',
  description: 'Removes an email alias from a Box user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one email alias from a user. Get the user ID from List Users and the alias ID from List Email Aliases.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    emailAliasId: Property.ShortText({
      displayName: 'Email Alias ID',
      description: 'ID of the alias to remove. Get it from List Email Aliases.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(propsValue.userId)}/email_aliases/${encodeURIComponent(propsValue.emailAliasId)}`,
    });
    return { deleted: true, userId: propsValue.userId, emailAliasId: propsValue.emailAliasId };
  },
});
