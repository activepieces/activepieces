import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from '../common/client';

export const createVoteAction = createAction({
  auth: cannyAuth,
  name: 'create_vote',
  displayName: 'Create Vote',
  description: 'Casts a vote on a post on behalf of a user.',
  props: {
    postID: Property.ShortText({
      displayName: 'Post ID',
      description: 'The unique identifier of the post to vote on.',
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
      path: '/votes/create',
      body: {
        postID: propsValue.postID,
        voterID: propsValue.voterID,
      },
    });
  },
});
