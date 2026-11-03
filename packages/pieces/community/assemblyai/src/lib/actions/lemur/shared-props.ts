import { Property } from '@activepieces/pieces-framework';

export const lemurRequestIdProp = Property.ShortText({
  displayName: 'LeMUR Request ID',
  description:
    'Found in the response of Run a Task Using LeMUR.',
  required: true,
});
