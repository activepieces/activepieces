import { Property } from '@activepieces/pieces-framework';

export const lemurRequestIdProp = Property.ShortText({
  displayName: 'LeMUR request ID',
  description:
    'The ID of the LeMUR request whose data you want to delete. This would be found in the response of the original request.',
  required: true,
});
