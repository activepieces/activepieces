import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getTopicByExternalIdAction = createAction({
  auth: discourseAuth,
  name: 'get_topic_by_external_id',
  classification: 'READ',
  displayName: 'Get Topic by External ID',
  description: 'Finds a Discourse topic by the external ID it was created with.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Look up a Discourse topic by the External ID set when it was created (for example by Create Topic (AI)). Fails with a not-found error when no topic has that external ID. Read-only.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({ displayName: 'External ID', required: true }),
  },
  outputSchema: discourseSchemas.topic,
  async run({ auth, propsValue }) {
    const externalId = discourseInput.text({ value: propsValue.external_id, label: 'External ID' });
    const topic = await discourseOps.findTopicByExternalId({ auth: auth.props, externalId });
    if (topic === null) {
      throw new Error(`No Discourse topic has the external ID "${externalId}".`);
    }
    return discourseMap.topic({ raw: topic, baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
