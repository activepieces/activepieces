import { Property } from '@activepieces/pieces-framework';

export const text = Property.LongText({
  displayName: 'Text',
  description: 'Input text',
  required: true,
});
