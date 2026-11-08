import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetLikeCountOutputSchema } from '../../../output-schemas';

export const getLikeCountAction = createAction({
  auth: podioAuth,
  name: 'podio_get_like_count',
  outputSchema: podioGetLikeCountOutputSchema,
  displayName: 'Get Like Count',
  description: 'Gets how many users liked an object.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the number of users who liked one Podio object. To see who liked it, use Get Who Liked Object.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/rating/${propsValue.refType}/${propsValue.refId}/like_count` });
  },
});
