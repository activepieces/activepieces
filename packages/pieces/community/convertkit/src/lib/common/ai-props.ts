import { Property } from '@activepieces/pieces-framework';

export const kitProps = {
  page: (description: string) =>
    Property.Number({
      displayName: 'Page',
      description,
      required: false,
      defaultValue: 1,
    }),
  sortOrder: (description: string) =>
    Property.StaticDropdown({
      displayName: 'Sort Order',
      description,
      required: false,
      options: {
        options: [
          { label: 'Ascending (oldest first)', value: 'asc' },
          { label: 'Descending (newest first)', value: 'desc' },
        ],
      },
    }),
  subscriberState: Property.StaticDropdown({
    displayName: 'Subscriber State',
    description:
      'Return only active or only cancelled subscriptions. Leave empty for the Kit default.',
    required: false,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  }),
  email: (description: string) =>
    Property.ShortText({
      displayName: 'Email',
      description,
      required: true,
    }),
  firstName: Property.ShortText({
    displayName: 'First Name',
    description: 'The first name to store on the subscriber.',
    required: false,
  }),
  fields: Property.Json({
    displayName: 'Custom Fields',
    description:
      'A JSON object of custom field key to value, e.g. {"last_name": "Snow"}. Keys must already exist; get them from List Custom Fields.',
    required: false,
  }),
  tagIds: (displayName: string, description: string) =>
    Property.Array({
      displayName,
      description,
      required: false,
    }),
  id: (displayName: string, description: string) =>
    Property.ShortText({
      displayName,
      description,
      required: true,
    }),
};
