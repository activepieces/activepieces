import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const updateTopicAction = createAction({
  auth: discourseAuth,
  name: 'update_topic',
  classification: 'WRITE',
  displayName: 'Update Topic',
  description: 'Changes the title or category of a Discourse topic.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename a Discourse topic and/or move it to another category, by numeric topic ID. Omitted fields stay unchanged; at least one is required. To edit the body text use Update Post on the first post. Sets absolute values, so safe to retry.',
    idempotent: true,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
    title: Property.ShortText({ displayName: 'New Title', required: false }),
    category_id: Property.ShortText({ displayName: 'New Category ID', description: 'Numeric category ID.', required: false }),
  },
  outputSchema: discourseSchemas.topicUpdate,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    const title = discourseInput.optionalText(propsValue.title);
    const categoryId = discourseInput.optionalId({ value: propsValue.category_id, label: 'New Category ID' });
    if (title === undefined && categoryId === undefined) {
      throw new Error('Provide a New Title, a New Category ID, or both.');
    }
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.PUT,
        path: `/t/-/${id}.json`,
        body: {
          ...(title === undefined ? {} : { title }),
          ...(categoryId === undefined ? {} : { category_id: Number(categoryId) }),
        },
      }),
    );
    const topic = discourseMap.topicSummary({ raw: body['basic_topic'], baseUrl: discourseOps.baseUrl(auth.props) });
    return {
      topic_id: topic.id ?? Number(id),
      title: topic.title ?? title ?? null,
      slug: topic.slug,
      category_id: topic.category_id ?? (categoryId === undefined ? null : Number(categoryId)),
      url: topic.url,
    };
  },
});
