import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetRatingsOutputSchema } from '../../../output-schemas';

export const getRatingsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_ratings',
  outputSchema: podioGetRatingsOutputSchema,
  displayName: 'Get Ratings',
  description: 'Gets the totals of one rating type on an object.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one rating type on a Podio object: the count and users per value, plus the average for fivestar. For every rating type at once use List Ratings.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
    ratingType: podioAiProps.choice({ required: true, displayName: 'Rating Type', description: 'The kind of rating: like, approved, rsvp, fivestar, yesno or thumbs.', values: ['like', 'approved', 'rsvp', 'fivestar', 'yesno', 'thumbs'] }),
  },
  async run({ auth, propsValue }) {
    const { refType, refId, ratingType } = propsValue;
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/rating/${refType}/${refId}/${ratingType}` });
  },
});
