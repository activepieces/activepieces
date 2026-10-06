import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getUserSocialsOutputSchema } from '../output-schemas';

export const getUserSocials = createAction({
  auth: huggingFaceAuth,
  name: 'get_user_socials',
  classification: 'READ',
  displayName: 'Get User Social Handles',
  description: 'Get the social media handles a Hugging Face user lists on their profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the social media handles a Hugging Face user has added to their profile (Twitter/X, GitHub, LinkedIn, Bluesky); a handle the user has not provided is null. Get User Profile has the rest of the profile but no handles; use Get Organization Social Handles for an organization. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getUserSocialsOutputSchema,
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
      path: `/api/users/${encodeURIComponent(context.propsValue.username.trim())}/socials`,
    });
    const body = hfHub.isRecord(response.body) ? response.body : {};
    const handles = hfHub.isRecord(body['socialHandles']) ? body['socialHandles'] : {};
    return {
      username: typeof body['user'] === 'string' ? body['user'] : context.propsValue.username.trim(),
      twitter: readHandle({ handles, key: 'twitter' }),
      github: readHandle({ handles, key: 'github' }),
      linkedin: readHandle({ handles, key: 'linkedin' }),
      bluesky: readHandle({ handles, key: 'bluesky' }),
    };
  },
});

function readHandle({ handles, key }: ReadHandleParams): string | null {
  const value = handles[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

type ReadHandleParams = {
  handles: Record<string, unknown>;
  key: string;
};
