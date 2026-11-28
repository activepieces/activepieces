import { createPostEventTrigger } from '../common/post-event-trigger';

export const postFailedTrigger = createPostEventTrigger({
  name: 'post_failed',
  displayName: 'Post Failed',
  description:
    'Triggers when a post fails to publish on one or more platforms.',
  aiDescription:
    'Fires once per AdaptlyPost post that failed on at least one platform, both when every platform failed (event post.failed) and when only some did (event post.partially_failed). The payload is the post with the failed platforms and their error messages.',
  events: ['post.failed', 'post.partially_failed'],
  testStatuses: ['FAILED', 'PARTIAL_FAILURE'],
  sampleStatus: 'FAILED',
});
