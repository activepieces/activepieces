import { createAction } from '@activepieces/pieces-framework';
import { linkedinCommon, publishOrganizationPost } from '../common';
import { linkedinAuth } from '../..';
import { createCompanyUpdateActionOutputSchema } from '../output-schemas';

export const createCompanyUpdate = createAction({
  auth: linkedinAuth,
  name: 'create_company_update',
  classification: 'WRITE',
  displayName: 'Create Company Update',
  description: 'Create a new company update for Company Page',
  audience: 'human',
  aiMetadata: {
    description:
      'Publishes a new post to a LinkedIn organization (company) page, with optional image and link preview; posts are always public. Use this to share content on behalf of a company rather than a personal profile, and requires the target organization id plus admin access to that page. Not idempotent: each call creates a separate post, so repeating it with the same text produces a duplicate.',
    idempotent: false,
  },
  props: {
    company: linkedinCommon.company,
    imageUrl: linkedinCommon.imageUrl,
    text: linkedinCommon.text,
    link: linkedinCommon.link,
    linkTitle: linkedinCommon.linkTitle,
    linkDescription: linkedinCommon.linkDescription,
  },
  outputSchema: createCompanyUpdateActionOutputSchema,

  run: async (context) => {
    const { company, text, link, linkTitle, linkDescription, imageUrl } =
      context.propsValue;

    return await publishOrganizationPost({
      accessToken: context.auth.access_token,
      organizationId: String(company),
      text,
      imageFile: imageUrl,
      link,
      linkTitle,
      linkDescription,
    });
  },
});
