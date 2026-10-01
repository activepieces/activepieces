import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createTopicOutputSchema } from '../output-schemas';

export const createTopic = createAction({
  name: 'create_topic',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Topic',
  outputSchema: createTopicOutputSchema,
  description: 'Create a new topic to segment audience preferences',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new topic (an opt-in/opt-out subscription category shown on the unsubscribe page) and returns its ID. The default subscription state is permanent once set. Not idempotent — each call creates a new topic even if the name matches an existing one.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Topic identifier, up to 50 characters.',
      required: true,
    }),
    default_subscription: Property.StaticDropdown({
      displayName: 'Default Subscription',
      description: 'Initial preference for new contacts. Cannot be changed after creation.',
      required: true,
      options: {
        options: [
          { label: 'Opted In', value: 'opt_in' },
          { label: 'Opted Out', value: 'opt_out' },
        ],
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Explanation shown to contacts, up to 200 characters.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Whether all contacts or only opted-in contacts see this topic on the unsubscribe page. Defaults to private.',
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
    const body: Record<string, unknown> = {
      name: propsValue.name,
      default_subscription: propsValue.default_subscription,
    };
    if (propsValue.description) body['description'] = propsValue.description;
    if (propsValue.visibility) body['visibility'] = propsValue.visibility;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/topics', body: body });
  },
});
