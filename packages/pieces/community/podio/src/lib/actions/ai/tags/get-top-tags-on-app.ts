import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetTopTagsOnAppOutputSchema } from '../../../output-schemas';

export const getTopTagsOnAppAction = createAction({
  auth: podioAuth,
  name: 'podio_get_top_tags_on_app',
  outputSchema: podioGetTopTagsOnAppOutputSchema,
  displayName: 'Get Top Tags On App',
  description: 'Lists the most used tags on an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the most used tags on the items of a Podio app. Use Get Tags On App for usage counts. The app id comes from List Apps In Space.',
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
      path: `/tag/app/${propsValue.appId}/top/`,
      query: podioUtils.query({ values: { limit: propsValue.limit, text: propsValue.text } }),
    });
    return { tags: body, count: body.length };
  },
});
