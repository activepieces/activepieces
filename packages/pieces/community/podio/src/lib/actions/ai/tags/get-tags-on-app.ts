import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTagsOnAppOutputSchema } from '../../../output-schemas';

export const getTagsOnAppAction = createAction({
  auth: podioAuth,
  name: 'podio_get_tags_on_app',
  outputSchema: podioGetTagsOnAppOutputSchema,
  displayName: 'Get Tags On App',
  description: 'Lists the tags used in an app with their usage counts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tags used on the items of an app, with how often each is used: the most used tags, sorted alphabetically. Use Get Top Tags On App for the most used tags only, and Get Objects On App With Tag to find what carries a tag. The app id comes from List Apps In Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    text: podioAiProps.text({ required: false, displayName: 'Tag Text', description: 'Only tags matching this text.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of tags to return.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/app/${propsValue.appId}/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, text: propsValue.text } }),
    });
    return { tags: body, count: body.length };
  },
});
