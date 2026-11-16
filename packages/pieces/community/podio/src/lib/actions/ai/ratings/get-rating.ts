import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetFlaggedConversationCountsOutputSchema } from '../../../output-schemas';

export const getRatingAction = createAction({
  auth: podioAuth,
  name: 'podio_get_rating',
  outputSchema: podioGetFlaggedConversationCountsOutputSchema,
  displayName: 'Get Rating',
  description: 'Gets one user\'s rating of one type on an object.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the rating value a given user gave a Podio object for one rating type. For the connected user use Get Own Rating. The user id comes from List Space Members or Get Ratings.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
    ratingType: podioAiProps.choice({ required: true, displayName: 'Rating Type', description: 'The kind of rating: like, approved, rsvp, fivestar, yesno or thumbs.', values: ['like', 'approved', 'rsvp', 'fivestar', 'yesno', 'thumbs'] }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the user, from List Space Members or the users in Get Ratings.' }),
  },
  async run({ auth, propsValue }) {
    const { refType, refId, ratingType, userId } = propsValue;
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/rating/${refType}/${refId}/${ratingType}/${userId}` });
  },
});
