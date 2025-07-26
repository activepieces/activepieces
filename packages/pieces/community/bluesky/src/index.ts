import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createPost } from './lib/actions/create-post';
import { likePost } from './lib/actions/like-post';
import { repostPost } from './lib/actions/repost-post';
import { findPost } from './lib/actions/find-post';
import { findThread } from './lib/actions/find-thread';
import { newPostsByAuthor } from './lib/triggers/new-posts-by-author';
import { newFollower } from './lib/triggers/new-follower';
import { newTimelinePosts } from './lib/triggers/new-timeline-posts';
import { newPostWithSearch } from './lib/triggers/new-post-with-search';

export const blueskyAuth = PieceAuth.CustomAuth({
  required: true,
  description: 'Authenticate with your Bluesky account (handle/email and app password).',
  props: {
    serviceUrl: Property.ShortText({
      displayName: 'Service URL',
      description: 'Bluesky service URL (e.g., https://bsky.social)',
      required: true,
      defaultValue: 'https://bsky.social',
    }),
    identifier: Property.ShortText({
      displayName: 'Handle or Email',
      description: 'Your Bluesky handle or email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'App Password',
      description: 'Your Bluesky app password',
      required: true,
    }),
  },
});

export default createPiece({
  displayName: 'Bluesky',
  description: 'Bluesky integration for Activepieces',
  logoUrl: 'https://cdn.activepieces.com/pieces/bluesky.png',
  authors: ['pranjal'],
  auth: blueskyAuth,
  actions: [createPost, likePost, repostPost, findPost, findThread],
  triggers: [newPostsByAuthor, newFollower, newTimelinePosts, newPostWithSearch],
});
