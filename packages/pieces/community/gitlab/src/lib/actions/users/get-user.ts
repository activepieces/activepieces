import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest } from '../../common/client';
import { requirePositiveInt } from '../../common/props';
import { userOutputSchema } from '../../output-schemas';

export const getUserAction = createAction({
  auth: gitlabAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Gets a user by numeric ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns a GitLab user's public profile by numeric user ID. To look a user up by username, use List Users with the Username filter instead.",
    idempotent: true,
  },
  props: {
    userId: Property.Number({
      displayName: 'User ID',
      description: 'Numeric user ID. Usernames are not accepted here.',
      required: true,
    }),
  },
  outputSchema: userOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({
      auth,
      method: 'GET',
      path: `/users/${requirePositiveInt({
        value: propsValue.userId,
        label: 'User ID',
      })}`,
    });
  },
});
