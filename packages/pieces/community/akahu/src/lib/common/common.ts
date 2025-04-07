import { Property } from '@activepieces/pieces-framework';

export const akahuCommon = {
  baseUrl: 'https://api.akahu.io/v1/',
  account_id: Property.ShortText({
    displayName: 'Account ID',
    description: 'An Akahu Account ID',
    required: true,
  }),
  start: Property.DateTime({
    displayName: 'Start',
    description: 'Start date',
    required: false,
  }),
  end: Property.DateTime({
    displayName: 'End',
    description: 'End date',
    required: false,
  }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description: 'Cursor from an earlier query',
    required: false,
  }),
};
