import { Property } from '@activepieces/pieces-framework';

export const akahuCommon = {
  baseUrl: 'https://api.akahu.io/v1/',
  start: Property.DateTime({
    displayName: 'start',
    description: 'start date',
    required: false,
  }),
  end: Property.DateTime({
    displayName: 'end',
    description: 'end date',
    required: false,
  }),
  cursor: Property.ShortText({
    displayName: 'cursor',
    description: 'cursor from an earlier query',
    required: false,
  }),
};
