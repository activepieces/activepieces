import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth } from '../common';

export const listChannels = createAction({
  auth: bulkpublishAuth,
  name: 'list_channels',
  displayName: 'List Channels',
  description: 'List connected social accounts.',
  props: {
    active: Property.Checkbox({ displayName: 'Active only', required: false, defaultValue: true }),
  },
  async run({ auth, propsValue }) {
    return bpRequest(auth.secret_text, HttpMethod.GET, '/api/channels', undefined, {
      active: String(propsValue.active ?? true),
    });
  },
});
