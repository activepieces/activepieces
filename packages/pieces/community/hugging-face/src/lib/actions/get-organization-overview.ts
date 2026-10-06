import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getOrganizationOverviewOutputSchema } from '../output-schemas';

export const getOrganizationOverview = createAction({
  auth: huggingFaceAuth,
  name: 'get_organization_overview',
  classification: 'READ',
  displayName: 'Get Organization Profile',
  description: 'Get the public profile of a Hugging Face organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the public profile of a Hugging Face organization: full name, avatar URL, verification and Enterprise status, follower and member counts, and how many models, datasets and Spaces it owns. Use List Organization Members for its members and Get User Profile for an individual user. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getOrganizationOverviewOutputSchema,
  props: {
    organization: Property.ShortText({
      displayName: 'Organization',
      description: "The organization's Hub name, for example 'huggingface' or 'meta-llama'.",
      required: true,
    }),
  },
  async run(context) {
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/organizations/${encodeURIComponent(context.propsValue.organization.trim())}/overview`,
    });
    return response.body;
  },
});
