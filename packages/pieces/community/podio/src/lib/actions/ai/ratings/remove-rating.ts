import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const removeRatingAction = createAction({
  auth: podioAuth,
  name: 'podio_remove_rating',
  displayName: 'Remove Rating',
  description: 'Removes the connected user\'s rating of one type from an object.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the connected user\'s own rating of one type from a Podio object, such as un-liking an item; Add Rating sets it again. Podio marks this endpoint deprecated.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the rated object, such as "item", "status", "comment" or "file".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the rated object, such as an item id from Filter Items or a status id from Get Status.' }),
    ratingType: podioAiProps.choice({ required: true, displayName: 'Rating Type', description: 'The kind of rating: like, approved, rsvp, fivestar, yesno or thumbs.', values: ['like', 'approved', 'rsvp', 'fivestar', 'yesno', 'thumbs'] }),
  },
  async run({ auth, propsValue }) {
    const { refType, refId, ratingType } = propsValue;
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/rating/${refType}/${refId}/${ratingType}` });
  },
});
