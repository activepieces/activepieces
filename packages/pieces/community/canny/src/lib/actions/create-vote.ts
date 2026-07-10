import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from '../common/client';

export const createVoteAction = createAction({
  auth: cannyAuth,
  name: 'create_vote',
  displayName: 'Create Vote',
  description: 'Casts a vote on a post on behalf of a user.',
  audience: 'both',
  aiMetadata: {
    description:
      'Registers a vote on a Canny post on behalf of a specific user. Use to record support for a feature request when acting as that voter. Requires the post ID and the voter Canny user ID. Effectively idempotent: re-voting the same user on the same post does not add duplicate votes.',
    idempotent: true,
  },
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
