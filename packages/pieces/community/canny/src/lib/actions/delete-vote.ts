import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from '../common/client';

export const deleteVoteAction = createAction({
  auth: cannyAuth,
  name: 'delete_vote',
  displayName: 'Delete Vote',
  description: 'Removes a vote from a post for a given user.',
  audience: 'both',
  aiMetadata: {
    description:
      "Removes a specific user's vote from a Canny post. Use to retract support previously registered for a post. Requires the post ID and the voter Canny user ID. Idempotent: removing an already-absent vote leaves the post in the same state.",
    idempotent: true,
  },
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
