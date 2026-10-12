import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getOrganizationSocialsOutputSchema } from '../output-schemas';

export const getOrganizationSocials = createAction({
  auth: huggingFaceAuth,
  name: 'get_organization_socials',
  classification: 'READ',
  displayName: 'Get Organization Social Handles',
  description: 'Get the social media handles a Hugging Face organization lists on its profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the social media handles a Hugging Face organization has added to its profile (Twitter/X, GitHub, LinkedIn); a handle it has not provided is null. Get Organization Profile has the rest of the profile but no handles; use Get User Social Handles for a person. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getOrganizationSocialsOutputSchema,
  props: {
    organization: Property.ShortText({
      displayName: 'Organization',
      description: "The organization's Hub name, for example 'huggingface'.",
      required: true,
    }),
  },
  async run(context) {
    const organization = context.propsValue.organization.trim();
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/organizations/${encodeURIComponent(organization)}/socials`,
    });
    const body = hfHub.isRecord(response.body) ? response.body : {};
    const handles = hfHub.isRecord(body['socialHandles']) ? body['socialHandles'] : {};
    return {
      organization: typeof body['org'] === 'string' ? body['org'] : organization,
      twitter: readHandle({ handles, key: 'twitter' }),
      github: readHandle({ handles, key: 'github' }),
      linkedin: readHandle({ handles, key: 'linkedin' }),
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
