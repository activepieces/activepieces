import { createAction, Property } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { firefliesClient } from '../common/client';
import { firefliesInput } from '../common/props';
import { firefliesQueries } from '../common/queries';
import { firefliesOutputSchemas } from '../output-schemas';

export const getUserDetailsAction = createAction({
  auth: firefliesAiAuth,
  name: 'get-user-details',
  classification: 'READ',
  displayName: 'Get User Details',
  description: 'Retrieves profile information by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Fireflies teammate profile (name, email, admin flag, transcript count, integrations, user groups) by exact user ID. Use Get Current User for the API key owner and List Users to find IDs. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.getUserDetails,
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
  },
  async run(context) {
    const userId = firefliesInput.requireText({ value: context.propsValue.userId, label: 'User ID' });
    const data = await firefliesClient.graphql({
      apiKey: context.auth,
      query: firefliesQueries.getUser,
      variables: { userId },
      operation: `get user ${userId}`,
    });
    return firefliesClient.requireEntity({
      data,
      key: 'user',
      notFound: `User "${userId}" was not found, or is not on the API key owner's team.`,
    });
  },
});
