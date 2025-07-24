import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest, getCurrentSession } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { postUriProperty } from '../common/props';

export const likePost = createAction({
  auth: blueskyAuth,
  name: 'likePost',
  displayName: 'Like Post',
  description: 'Like a post on Bluesky using its URI and CID',
  props: {
    postUri: postUriProperty,
    postCid: Property.ShortText({
      displayName: 'Post CID',
      description: 'The CID (Content Identifier) of the post to like',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { postUri, postCid } = propsValue;

    try {
      // Get current session to obtain the user's DID
      const session = await getCurrentSession(auth);

      // Create the like record
      const likeRecord = {
        subject: {
          uri: postUri,
          cid: postCid,
        },
        createdAt: new Date().toISOString(),
      };

      // Create the like using com.atproto.repo.createRecord
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.POST,
        'com.atproto.repo.createRecord',
        {
          repo: session.did,
          collection: 'app.bsky.feed.like',
          record: likeRecord,
        },
        undefined,
        true
      );

      return {
        success: true,
        likeUri: response.uri,
        likeCid: response.cid,
        postUri: postUri,
        postCid: postCid,
        createdAt: likeRecord.createdAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to like post: ${errorMessage}`);
    }
  },
});
