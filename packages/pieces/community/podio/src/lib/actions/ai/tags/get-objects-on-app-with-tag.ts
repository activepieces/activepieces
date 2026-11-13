import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectsOnAppWithTagOutputSchema } from '../../../output-schemas';

export const getObjectsOnAppWithTagAction = createAction({
  auth: podioAuth,
  name: 'podio_get_objects_on_app_with_tag',
  outputSchema: podioGetObjectsOnAppWithTagOutputSchema,
  displayName: 'Get Objects On App With Tag',
  description: 'Lists the items in an app that carry a tag.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the items in a Podio app that carry the given tag, most recently tagged first. Tag texts come from Get Tags On App. The app id comes from List Apps In Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    text: podioAiProps.text({ required: true, displayName: 'Tag', description: 'The text of the tag to look for.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/app/${propsValue.appId}/search/`,
      query: podioUtils.query({ values: { text: propsValue.text } }),
    });
    return { objects: body, count: body.length };
  },
});
