import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from '../common/client';

export const deleteVoteAction = createAction({
  auth: cannyAuth,
  name: 'delete_vote',
  displayName: 'Delete Vote',
  description: 'Removes a vote from a post for a given user.',
  props: {
    postID: Property.ShortText({
      displayName: 'Post ID',
      description: 'The unique identifier of the post to remove the vote from.',
      required: true,
    }),
    voterID: Property.ShortText({
      displayName: 'Voter ID',
      description: 'The unique identifier of the voter (Canny user ID).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cannyRequest({
      apiKey: auth.secret_text,
      path: '/votes/delete',
      body: {
        postID: propsValue.postID,
        voterID: propsValue.voterID,
      },
    });
  },
});
