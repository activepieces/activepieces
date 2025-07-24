import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest, getCurrentSession } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { postUriProperty } from '../common/props';

export const repostPost = createAction({
  auth: blueskyAuth,
  name: 'repostPost',
  displayName: 'Repost Post',
  description: 'Repost a post on Bluesky using its URI and CID',
  props: {
    postUri: postUriProperty,
    postCid: Property.ShortText({
      displayName: 'Post CID',
      description: 'The CID (Content Identifier) of the post to repost',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { postUri, postCid } = propsValue;

    try {
      // Get current session to obtain the user's DID
      const session = await getCurrentSession(auth);

      // Create the repost record
      const repostRecord = {
        subject: {
          uri: postUri,
          cid: postCid,
        },
        createdAt: new Date().toISOString(),
      };

      // Create the repost using com.atproto.repo.createRecord
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.POST,
        'com.atproto.repo.createRecord',
        {
          repo: session.did,
          collection: 'app.bsky.feed.repost',
          record: repostRecord,
        },
        undefined,
        true
      );

      return {
        success: true,
        repostUri: response.uri,
        repostCid: response.cid,
        postUri: postUri,
        postCid: postCid,
        createdAt: repostRecord.createdAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to repost: ${errorMessage}`);
    }
  },
});
