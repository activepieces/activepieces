import { createPostEventTrigger } from '../common/post-event-trigger';

export const postScheduledTrigger = createPostEventTrigger({
  name: 'post_scheduled',
  displayName: 'Post Scheduled',
  description: 'Triggers when a post is scheduled for a future time.',
  aiDescription:
    'Fires once each time an AdaptlyPost post is scheduled for a future time, whether it was created that way or a draft was scheduled. The payload is the post with its scheduled time.',
  events: ['post.scheduled'],
  testStatuses: ['SCHEDULED'],
  sampleStatus: 'SCHEDULED',
});
