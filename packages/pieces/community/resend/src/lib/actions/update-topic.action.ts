import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { updateTopicOutputSchema } from '../output-schemas';

export const updateTopic = createAction({
  name: 'update_topic',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Topic',
  outputSchema: updateTopicOutputSchema,
  description: "Update a topic's name, description, or visibility",
  audience: 'ai',
  aiMetadata: { description: 'Updates the name, description, or visibility of an existing topic, identified by ID. Only supplied fields change; the default subscription setting cannot be changed after creation. Idempotent — re-applying the same values leaves the topic unchanged.', idempotent: true },
  props: {
    topic_id: resendProps.topicId,
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.name) body['name'] = propsValue.name;
    if (propsValue.description) body['description'] = propsValue.description;
    if (propsValue.visibility) body['visibility'] = propsValue.visibility;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/topics/${propsValue.topic_id}`, body: body });
  },
});
