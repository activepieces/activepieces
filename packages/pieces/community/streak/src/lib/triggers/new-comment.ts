import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const newCommentTrigger = createPipelineWebhookTrigger({
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a comment is added to a box in the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when a new comment is posted on a box in the selected pipeline, representing a note or update added to a CRM record\'s activity feed.',
  },
  event: 'COMMENT_CREATE',
  sampleData: {
    key: 'agxzfm1haWxmb29nYWVyMQsSB0NvbW1lbnQYgICAwI_oogow',
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    message: 'Heads up, just got off the phone with the buyer.',
    creatorKey: 'agxzfm1haWxmb29nYWVyMQsSBFVzZXIY3AYM',
    creationDate: 1714080000000,
  },
});
