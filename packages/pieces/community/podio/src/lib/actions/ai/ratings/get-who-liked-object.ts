import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetWhoLikedObjectOutputSchema } from '../../../output-schemas';

export const getWhoLikedObjectAction = createAction({
  auth: podioAuth,
  name: 'podio_get_who_liked_object',
  outputSchema: podioGetWhoLikedObjectOutputSchema,
  displayName: 'Get Who Liked Object',
  description: 'Lists the profiles of users who liked an object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the profiles of the users who liked one Podio object, up to Limit. For only the number of likes use Get Like Count.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of profiles to return. Defaults to 10.' }),
  },
  async run({ auth, propsValue }) {
    const { refType, refId, limit } = propsValue;
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/rating/${refType}/${refId}/liked_by/`,
      query: podioUtils.query({ values: { limit: limit ?? 10 } }),
    });
    return { profiles: body, count: body.length };
  },
});
