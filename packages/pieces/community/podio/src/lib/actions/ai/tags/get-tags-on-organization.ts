import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTagsOnAppOutputSchema } from '../../../output-schemas';

export const getTagsOnOrganizationAction = createAction({
  auth: podioAuth,
  name: 'podio_get_tags_on_organization',
  outputSchema: podioGetTagsOnAppOutputSchema,
  displayName: 'Get Tags On Organization',
  description: 'Lists the tags used in an organization with their usage counts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tags used on items and statuses across the workspaces of an organization the user belongs to, with how often each is used: the most used tags, sorted alphabetically. Use Get Objects On Organization With Tag to find what carries a tag. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    text: podioAiProps.text({ required: false, displayName: 'Tag Text', description: 'Only tags matching this text.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tags to return.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/org/${propsValue.orgId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, text: propsValue.text } }),
    });
    return { tags: body, count: body.length };
  },
});
