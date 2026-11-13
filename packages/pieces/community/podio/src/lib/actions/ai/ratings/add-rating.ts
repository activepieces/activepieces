import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioAddRatingOutputSchema } from '../../../output-schemas';

export const addRatingAction = createAction({
  auth: podioAuth,
  name: 'podio_add_rating',
  outputSchema: podioAddRatingOutputSchema,
  displayName: 'Add Rating',
  description: 'Rates an object as the connected user, such as liking an item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the connected user\'s rating of one type on a Podio object, such as a like on an item or a fivestar score; posting again replaces the earlier rating of that type. Podio marks this endpoint deprecated. Remove Rating undoes it.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
    ratingType: podioAiProps.choice({ required: true, displayName: 'Rating Type', description: 'The kind of rating: like, approved, rsvp, fivestar, yesno or thumbs.', values: ['like', 'approved', 'rsvp', 'fivestar', 'yesno', 'thumbs'] }),
    value: podioAiProps.number({ required: true, displayName: 'Value', description: 'The rating value: like 1; fivestar 1 to 5; approved, yesno and thumbs 0 or 1; rsvp 0 (attend), 1 (not attend) or 2 (maybe).' }),
  },
  async run({ auth, propsValue }) {
    const { refType, refId, ratingType, value } = propsValue;
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/rating/${refType}/${refId}/${ratingType}`, body: { value } });
  },
});
