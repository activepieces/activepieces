import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTagsOnAppOutputSchema } from '../../../output-schemas';

export const getTagsOnSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_tags_on_space',
  outputSchema: podioGetTagsOnAppOutputSchema,
  displayName: 'Get Tags On Space',
  description: 'Lists the tags used in a workspace with their usage counts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tags used on the items and statuses of a workspace, with how often each is used: the most used tags, sorted alphabetically. Use Get Objects On Space With Tag to find what carries a tag. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    text: podioAiProps.text({ required: false, displayName: 'Tag Text', description: 'Only tags matching this text.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tags to return.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/space/${propsValue.spaceId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, text: propsValue.text } }),
    });
    return { tags: body, count: body.length };
  },
});
