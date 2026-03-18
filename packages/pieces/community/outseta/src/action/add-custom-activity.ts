import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addCustomActivityAction = createAction({
  name: 'add_custom_activity',
  auth: outsetaAuth,
  displayName: 'Add Custom Activity',
  description:
    'Record a custom activity on an account, person, or deal. These activities show up on the activity feed and can trigger drip campaigns.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description:
        'The activity title. Must match the start/stop value in drip campaigns if used for automation.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    activityData: Property.LongText({
      displayName: 'Data',
      required: false,
      description: 'A string that can be used to store serialized JSON.',
    }),
    entityType: Property.StaticDropdown({
      displayName: 'Entity Type',
      required: true,
      options: {
        options: [
          { label: 'Account', value: 1 },
          { label: 'Person', value: 2 },
          { label: 'Deal', value: 3 },
        ],
      },
    }),
    entityUid: Property.ShortText({
      displayName: 'Entity UID',
      required: true,
      description: 'The UID of the account, person, or deal.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Title: context.propsValue.title,
      EntityType: context.propsValue.entityType,
      EntityUid: context.propsValue.entityUid,
    };

    if (context.propsValue.description) {
      body['Description'] = context.propsValue.description;
    }
    if (context.propsValue.activityData) {
      body['ActivityData'] = context.propsValue.activityData;
    }

    return await client.post<any>(
      '/api/v1/activities/customactivity',
      body
    );
  },
});
