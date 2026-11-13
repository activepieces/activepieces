import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const markNotificationsAsViewedByRefAction = createAction({
  auth: podioAuth,
  name: 'podio_mark_notifications_as_viewed_by_ref',
  displayName: 'Mark Notifications As Viewed By Ref',
  description: 'Marks all notifications about one object as viewed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks every Podio notification about one object, such as an item, task or status, as viewed, moving them to the viewed archive; Mark Notifications As Unviewed By Ref reverses it. The object type and id come from the context ref of a notification in Get Notifications.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object, such as "item", "task", "status" or "conversation".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, from the context ref of a notification in Get Notifications.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/notification/${propsValue.refType}/${propsValue.refId}/viewed` });
  },
});
