import { Property } from '@activepieces/pieces-framework';

export const tagIdProp = Property.ShortText({
  displayName: 'Tag ID',
  description: 'The ID of the tag',
  required: true,
});

export const listIdProp = Property.ShortText({
  displayName: 'List ID',
  description: 'The ID of the list',
  required: true,
});
