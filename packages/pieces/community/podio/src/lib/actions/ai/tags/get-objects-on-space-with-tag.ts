import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectsOnAppWithTagOutputSchema } from '../../../output-schemas';

export const getObjectsOnSpaceWithTagAction = createAction({
  auth: podioAuth,
  name: 'podio_get_objects_on_space_with_tag',
  outputSchema: podioGetObjectsOnAppWithTagOutputSchema,
  displayName: 'Get Objects On Space With Tag',
  description: 'Lists the objects in a workspace that carry a tag.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio objects, such as items and statuses, in a workspace that carry the given tag, most recently tagged first. Tag texts come from Get Tags On Space. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    text: podioAiProps.text({ required: true, displayName: 'Tag', description: 'The text of the tag to look for.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/space/${propsValue.spaceId}/search/`,
      query: podioUtils.query({ values: { text: propsValue.text } }),
    });
    return { objects: body, count: body.length };
  },
});
