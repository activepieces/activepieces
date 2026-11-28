import { createPostEventTrigger } from '../common/post-event-trigger';

export const postPublishedTrigger = createPostEventTrigger({
  name: 'post_published',
  displayName: 'Post Published',
  description:
    'Triggers when a post finishes publishing on every platform it was sent to.',
  aiDescription:
    'Fires once per AdaptlyPost post when it has published on all of its platforms. The payload is the post with its post URL on each platform. Posts that fail on some platforms fire Post Failed instead.',
  events: ['post.published'],
  testStatuses: ['COMPLETED'],
  sampleStatus: 'COMPLETED',
});
