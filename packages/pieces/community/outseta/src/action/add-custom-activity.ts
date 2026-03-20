import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { makeClient } from '../common/dropdowns';

export const addCustomActivityAction = createAction({
  name: 'add_custom_activity',
  auth: outsetaAuth,
  displayName: 'Add Custom Activity',
  description:
    'Record a custom activity on an account, person, or deal. Activities show on the activity feed and can trigger drip campaigns.',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description:
        'The activity title. Must match the start/stop value in drip campaigns if used for automation.',
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
    entityUid: Property.Dropdown({
      auth: outsetaAuth,
      displayName: 'Entity',
      description: 'Select the account, person, or deal to record the activity on.',
      refreshers: ['entityType'],
      required: true,
      options: async ({ auth, entityType }) => {
        const client = makeClient(auth);
        if (!client) {
          return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
        }
        if (!entityType) {
          return { disabled: true, options: [], placeholder: 'Select an entity type first.' };
        }
        try {
          let path = '';
          if (entityType === 1) path = '/api/v1/crm/accounts?$top=100';
          else if (entityType === 2) path = '/api/v1/crm/people?$top=100';
          else if (entityType === 3) path = '/api/v1/crm/deals?$top=100';
          else return { disabled: true, options: [], placeholder: 'Unknown entity type.' };

          const res = await client.get<any>(path);
          const items: any[] = res?.items ?? res?.Items ?? [];
          return {
            disabled: false,
            options: items.map((item: any) => {
              if (entityType === 2) {
                 
                return { label: `${item.FullName} (${item.Email ?? item.Uid})`, value: item.Uid };
              }
              return { label: item.Name ?? item.Uid, value: item.Uid };
            }),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load entities.' };
        }
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    activityData: Property.LongText({
      displayName: 'Data',
      required: false,
      description: 'Optional string to store serialized JSON or other metadata with this activity.',
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

    const result = await client.post<any>(
      '/api/v1/activities/customactivity',
      body
    );

    return {
      uid: result.Uid ?? null,
      title: result.Title ?? null,
      entity_type: result.EntityType ?? null,
      entity_uid: result.EntityUid ?? null,
      created: result.Created ?? null,
    };
  },
});
