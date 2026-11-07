import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getTopicAction = createAction({
  auth: discourseAuth,
  name: 'get_topic',
  classification: 'READ',
  displayName: 'Get Topic',
  description: 'Returns a Discourse topic by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Discourse topic by numeric topic ID: title, category, tags, status flags, counts and the first post HTML. Use Get Topic Posts for the replies. Read-only.',
    idempotent: true,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
  },
  outputSchema: discourseSchemas.topic,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    const body = await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/t/${id}.json` });
    return discourseMap.topic({ raw: body, baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
