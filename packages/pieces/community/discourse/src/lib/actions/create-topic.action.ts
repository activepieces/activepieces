import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../auth';
import { discourseOps } from '../common/operations';
import { discourseProps } from '../common/props';
import { discourseSchemas } from '../common/schemas';

export const createTopic = createAction({
  auth: discourseAuth,
  name: 'create_topic',
  classification: 'WRITE',
  description: 'Create a new topic in Discourse',
  audience: 'human',
  aiMetadata: {
    description:
      'Start a new Discourse topic with a title and body, filed under a category picked from a dropdown. Agents should use Create Topic (AI), which takes the category ID as text and supports an external ID for safe retries. Each call creates a new topic.',
    idempotent: false,
  },
  displayName: 'Create Topic',
  props: {
    title: Property.ShortText({
      description: 'Title of the Topic',
      displayName: 'Topic Title',
      required: true,
    }),
    raw: Property.LongText({
      description: 'Content of the topic (Markdown)',
      displayName: 'Topic Content',
      required: true,
    }),
    category: discourseProps.categoryDropdown(),
  },
  outputSchema: discourseSchemas.createdTopic,
  async run({ auth, propsValue }) {
    return discourseOps.createTopic({
      auth: auth.props,
      title: propsValue.title,
      raw: propsValue.raw,
      categoryId: propsValue.category,
    });
  },
});
