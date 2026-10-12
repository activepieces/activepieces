import { makePostStatusTrigger } from './factory';

export const newPublishedPost = makePostStatusTrigger({
  name: 'new_published_post',
  displayName: 'New Post Published',
  description: 'Fires when a post finishes publishing (status "published").',
  status: 'published',
  sampleStatus: 'published',
});

export const postFailed = makePostStatusTrigger({
  name: 'post_failed',
  displayName: 'Post Failed',
  description: 'Fires when a post fails on every platform (status "failed"). Partial failures are not included.',
  status: 'failed',
  sampleStatus: 'failed',
});

export const newScheduledPost = makePostStatusTrigger({
  name: 'new_scheduled_post',
  displayName: 'New Scheduled Post',
  description: 'Fires when a post is scheduled (status "scheduled").',
  status: 'scheduled',
  sampleStatus: 'scheduled',
});
