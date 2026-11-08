import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListRatingsOutputSchema } from '../../../output-schemas';

export const listRatingsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_ratings',
  outputSchema: podioListRatingsOutputSchema,
  displayName: 'List Ratings',
  description: 'Gets every enabled rating type on an object with its counts and users.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads all ratings on one Podio object, grouped by each rating type enabled on it, with the count and users per value. For one rating type with its fivestar average use Get Ratings; for just the like count use Get Like Count.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/rating/${propsValue.refType}/${propsValue.refId}` });
  },
});
