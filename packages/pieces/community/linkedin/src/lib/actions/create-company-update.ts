import { createAction, tryCatch } from '@activepieces/pieces-framework';
import {
  buildLinkedinError,
  linkedinCommon,
  publishOrganizationPost,
} from '../common';
import { linkedinAuth } from '../..';
import { createCompanyUpdateActionOutputSchema } from '../output-schemas';

export const createCompanyUpdate = createAction({
  auth: linkedinAuth,
  name: 'create_company_update',
  classification: 'WRITE',
  displayName: 'Create Company Update',
  description: 'Post on a LinkedIn Company Page you manage',
  audience: 'human',
  aiMetadata: {
    description:
      'Publishes a new post to a LinkedIn organization (company) page, with optional image and link preview; posts are always public. Use this to share content on behalf of a company rather than a personal profile, and requires the target organization id plus admin access to that page. Not idempotent: each call creates a separate post, so repeating it with the same text produces a duplicate.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'post_as',
      display: 'section',
      label: 'Post As',
      icon: 'users',
      props: ['company', 'company_visibility_info'],
    },
    {
      key: 'post',
      display: 'section',
      label: 'Post',
      icon: 'text',
      props: ['text', 'imageUrl'],
    },
    {
      key: 'link_preview',
      display: 'section',
      label: 'Link Preview',
      icon: 'paperclip',
      props: ['link_preview_info', 'link', 'linkTitle', 'linkDescription'],
    },
  ],
  props: {
    company: linkedinCommon.company,
    company_visibility_info: linkedinCommon.companyVisibilityInfo,
    text: linkedinCommon.text,
    imageUrl: linkedinCommon.postImage,
    link_preview_info: linkedinCommon.linkPreviewInfo,
    link: linkedinCommon.link,
    linkTitle: linkedinCommon.linkTitle,
    linkDescription: linkedinCommon.linkDescription,
  },
  outputSchema: createCompanyUpdateActionOutputSchema,

  run: async (context) => {
    const { company, text, link, linkTitle, linkDescription, imageUrl } =
      context.propsValue;

    const { data, error } = await tryCatch(() =>
      publishOrganizationPost({
        accessToken: context.auth.access_token,
        organizationId: String(company),
        text,
        imageFile: imageUrl,
        link,
        linkTitle,
        linkDescription,
      })
    );
    if (error) {
      throw buildLinkedinError({ error, resource: 'the Company Page' });
    }
    return data;
  },
});
