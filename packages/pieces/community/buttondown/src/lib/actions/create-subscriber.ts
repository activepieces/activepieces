import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../auth';
import { buttondownApiRequest } from '../common';

export const createSubscriber = createAction({
  auth: buttondownAuth,
  name: 'create_subscriber',
  displayName: 'Create Subscriber',
  description: 'Add a new subscriber to your Buttondown newsletter',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Optional notes about the subscriber',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional JSON metadata to attach to the subscriber',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the subscriber',
      required: false,
    }),
    collisionBehavior: Property.StaticDropdown({
      displayName: 'Collision Behavior',
      description: 'What to do if the subscriber already exists',
      required: false,
      defaultValue: 'error',
      options: {
        disabled: false,
        options: [
          { label: 'Error', value: 'error' },
          { label: 'Overwrite', value: 'overwrite' },
          { label: 'Add', value: 'add' },
        ],
      },
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      email_address: context.propsValue.email,
    };

    if (context.propsValue.notes) {
      body.notes = context.propsValue.notes;
    }
    if (context.propsValue.metadata) {
      body.metadata = context.propsValue.metadata;
    }
    if (context.propsValue.tags && context.propsValue.tags.length > 0) {
      body.tags = context.propsValue.tags;
    }

    const headers: Record<string, string> = {};
    if (
      context.propsValue.collisionBehavior &&
      context.propsValue.collisionBehavior !== 'error'
    ) {
      headers['X-Buttondown-Collision-Behavior'] =
        context.propsValue.collisionBehavior;
    }

    return await buttondownApiRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/subscribers',
      body,
    });
  },
});
