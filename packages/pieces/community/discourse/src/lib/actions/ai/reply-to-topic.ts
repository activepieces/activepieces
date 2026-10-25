import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const replyToTopicAction = createAction({
  auth: discourseAuth,
  name: 'reply_to_topic',
  classification: 'WRITE',
  displayName: 'Reply to Topic',
  description: 'Posts a reply in a Discourse topic or private message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Post a Markdown reply in an existing Discourse topic or private message conversation by numeric topic ID, optionally as a reply to a specific post number. Use Create Topic (AI) to start a new thread instead. Each call creates a new post, so retries duplicate.',
    idempotent: false,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
    raw: Property.LongText({ displayName: 'Content', description: 'Reply text in Markdown.', required: true }),
    reply_to_post_number: Property.Number({
      displayName: 'Reply To Post Number',
      description: 'Optional post number in the topic to reply to (1 = first post).',
      required: false,
    }),
  },
  outputSchema: discourseSchemas.createdPost,
  async run({ auth, propsValue }) {
    return discourseOps.createPost({
      auth: auth.props,
      topicId: propsValue.topic_id,
      raw: propsValue.raw,
      replyToPostNumber: propsValue.reply_to_post_number,
    });
  },
});
