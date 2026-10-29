import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { encodeSegment, gitlabRequest } from '../../common/client';
import { optionalText } from '../../common/props';
import { userStatusOutputSchema } from '../../output-schemas';

export const getUserStatusAction = createAction({
  auth: gitlabAuth,
  name: 'get_user_status',
  displayName: 'Get User Status',
  description: 'Gets the status (emoji, message, availability) of a user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns a GitLab user's status: emoji, message, availability (busy or not set) and when it clears. Leave User empty for the connected user, or pass a numeric ID or username.",
    idempotent: true,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User ID or Username',
      description: 'Leave empty for the connected user.',
      required: false,
    }),
  },
  outputSchema: userStatusOutputSchema,
  async run({ auth, propsValue }) {
    const user = optionalText(propsValue.user)?.replace(/^@/, '');
    return gitlabRequest({
      auth,
      method: 'GET',
      path:
        user === undefined
          ? '/user/status'
          : `/users/${encodeSegment({
              value: user,
              label: 'User ID or Username',
            })}/status`,
    });
  },
});
