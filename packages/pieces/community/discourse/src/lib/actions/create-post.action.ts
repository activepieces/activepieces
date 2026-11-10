import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseOps } from '../common/operations';
import { discourseProps } from '../common/props';
import { discourseSchemas } from '../common/schemas';

export const createPost = createAction({
  auth: discourseAuth,
  name: 'create_post',
  classification: 'WRITE',
  description: 'Create a new post in discourse',
  audience: 'human',
  aiMetadata: {
    description:
      'Add a reply post to an existing Discourse topic picked from a dropdown of recently active topics. Agents should use Reply to Topic, which takes the topic ID as text. Each call creates a new post, so retries duplicate.',
    idempotent: false,
  },
  displayName: 'Create Post',
  props: {
    raw: Property.LongText({
      description: 'Content of the post (Markdown)',
      displayName: 'Post Content',
      required: true,
    }),
    topic_id: discourseProps.topicDropdown(),
  },
  outputSchema: discourseSchemas.createdPost,
  async run({ auth, propsValue }) {
    return discourseOps.createPost({ auth: auth.props, topicId: propsValue.topic_id, raw: propsValue.raw });
  },
});
