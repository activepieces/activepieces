import { Property } from '@activepieces/pieces-framework';

export const dripProps = {
  accountId: () =>
    Property.ShortText({
      displayName: 'Account ID',
      description: 'Drip account ID (digits, from List Accounts or the Drip URL). Leave empty when the API token has only one account.',
      required: false,
    }),
  subscriber: ({ description }: { description?: string } = {}) =>
    Property.ShortText({
      displayName: 'Subscriber Email or ID',
      description: description ?? 'The subscriber email address or Drip subscriber ID.',
      required: true,
    }),
  email: ({ required = true, description }: { required?: boolean; description?: string } = {}) =>
    Property.ShortText({
      displayName: 'Email',
      description: description ?? 'The subscriber email address.',
      required,
    }),
  page: () =>
    Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Pass the next page while Has More is true.',
      required: false,
      defaultValue: 1,
    }),
  perPage: ({ max }: { max: number }) =>
    Property.Number({
      displayName: 'Results per Page',
      description: `How many results per page (1-${max}).`,
      required: false,
      defaultValue: 100,
    }),
  tags: ({ displayName = 'Tags', description }: { displayName?: string; description?: string } = {}) =>
    Property.Array({
      displayName,
      description: description ?? 'Tags to apply to the subscriber.',
      required: false,
    }),
  customFields: () =>
    Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom field values keyed by field identifier, e.g. {"shirt_size": "Medium"}. A new identifier creates the custom field in Drip.',
      required: false,
    }),
  timeZone: () =>
    Property.ShortText({
      displayName: 'Time Zone',
      description: 'The subscriber time zone in Olson format, e.g. America/Los_Angeles.',
      required: false,
    }),
};

export const pagingDefaults = {
  perPage: 100,
  maxPerPage: 1000,
  maxPerPageSmall: 100,
};
