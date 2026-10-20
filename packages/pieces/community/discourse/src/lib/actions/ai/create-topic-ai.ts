import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const createTopicAiAction = createAction({
  auth: discourseAuth,
  name: 'create_topic_ai',
  classification: 'WRITE',
  displayName: 'Create Topic (AI)',
  description: 'Creates a Discourse topic with optional category, tags and external ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Start a new public Discourse topic with a title and Markdown body, optionally in a category (numeric ID from List Categories) and with tags. Pass an External ID to make retries safe: if a topic with that external ID exists it is returned with already_existed true instead of creating a duplicate. Without it each call creates a new topic.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    raw: Property.LongText({ displayName: 'Content', description: 'First post in Markdown.', required: true }),
    category_id: Property.ShortText({ displayName: 'Category ID', description: 'Optional numeric category ID.', required: false }),
    tags: Property.Array({ displayName: 'Tags', description: 'Optional tag names. Tagging must be enabled on the forum.', required: false }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Optional unique ID from your system, prevents duplicates.',
      required: false,
    }),
  },
  outputSchema: discourseSchemas.createdTopic,
  async run({ auth, propsValue }) {
    return discourseOps.createTopic({
      auth: auth.props,
      title: propsValue.title,
      raw: propsValue.raw,
      categoryId: propsValue.category_id,
      tags: propsValue.tags,
      externalId: propsValue.external_id,
    });
  },
});
