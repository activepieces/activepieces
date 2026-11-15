import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetCurrentUserOutputSchema } from '../../../output-schemas';

export const getUser = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_user',
  outputSchema: microsoftTeamsGetCurrentUserOutputSchema,
  displayName: 'Get User',
  description: 'Gets a user by ID or user principal name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one user's basic profile (user ID, display name, mail, user principal name, job title) by user ID or user principal name. Use it to turn an email-style principal name into the user ID that chat and presence actions take.",
    idempotent: true,
  },
  props: {
    userId: microsoftTeamsAiProps.userId({ required: true }),
  },
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(`/users/${context.propsValue.userId}`).get());
  },
});
