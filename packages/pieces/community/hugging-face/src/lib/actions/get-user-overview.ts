import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getUserOverviewOutputSchema } from '../output-schemas';

export const getUserOverview = createAction({
  auth: huggingFaceAuth,
  name: 'get_user_overview',
  classification: 'READ',
  displayName: 'Get User Profile',
  description: 'Get the public profile of a Hugging Face user.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the public profile of a Hugging Face user: full name, avatar URL, PRO status, organizations, follower counts and how many models, datasets and Spaces they own. Use Get Current User & Token for the connected account itself and Get Organization Profile for an organization. Social handles are not included. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getUserOverviewOutputSchema,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: "The user's Hub username, for example 'julien-c'.",
      required: true,
    }),
  },
  async run(context) {
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/users/${encodeURIComponent(context.propsValue.username.trim())}/overview`,
    });
    return response.body;
  },
});
