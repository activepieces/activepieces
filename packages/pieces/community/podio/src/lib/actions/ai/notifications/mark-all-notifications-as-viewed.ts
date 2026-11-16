import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';

export const markAllNotificationsAsViewedAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_all_notifications_as_viewed',
  displayName: 'Mark All Notifications As Viewed',
  description: 'Marks all your notifications as viewed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every notification in the connected user\'s Podio inbox as viewed, moving them to the viewed archive. To mark one use Mark Notification As Viewed; for one object use Mark Notifications As Viewed By Ref.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: '/notification/viewed' });
  },
});
