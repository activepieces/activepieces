import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient } from '../common/client';

export const deletePushUser = createAction({
  auth: hibiraAuth,
  name: 'delete_push_user',
  displayName: 'Delete Push User',
  description: 'Removes a user and all their devices from push notifications, for example when they delete their account.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete one user ID and every device registered to it from Hibira Push. The user gets no more notifications until their app registers again. Cannot be undone.',
    idempotent: true,
  },
  props: {
    userId: Property.ShortText({ displayName: 'User ID', required: true }),
  },
  async run({ auth, propsValue }) {
    await hibiraClient.push(auth, {
      method: 'DELETE',
      path: `/customer_api/v1/instances/{instance}/users/${encodeURIComponent(propsValue.userId)}`,
    });
    return { userId: propsValue.userId, success: true };
  },
});
