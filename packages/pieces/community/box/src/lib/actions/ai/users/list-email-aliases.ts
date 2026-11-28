import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxListEmailAliasesOutputSchema } from '../../../output-schemas';

export const listEmailAliasesAction = createAction({
  auth: boxAuth,
  name: 'box_list_email_aliases',
  outputSchema: boxListEmailAliasesOutputSchema,
  displayName: 'List Email Aliases',
  description: 'Lists the email aliases of a Box user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all extra email addresses of a user, with their IDs and whether each is confirmed; the primary login is not included. Needs admin rights for other users. Get the user ID from List Users.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(propsValue.userId)}/email_aliases`,
    });
  },
});
