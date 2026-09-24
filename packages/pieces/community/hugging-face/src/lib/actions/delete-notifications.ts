import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfUtils } from '../common/utils';
import { hfSettingsApi } from '../common/webhooks';

export const deleteNotifications = createAction({
  auth: huggingFaceAuth,
  name: 'delete_notifications',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Notifications',
  description: 'Delete specific notifications from the Hugging Face inbox of the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently removes the notifications for the given discussions from the connected account's Hub inbox; the discussions themselves are untouched. Pass the 24-character discussion_id values returned by List Notifications, not per-repository discussion numbers. Only the listed notifications are removed, never the whole inbox. Needs a 'write' role token. Cannot be undone, and a retry after success has nothing left to delete.",
    idempotent: false,
  },
  props: {
    discussion_ids: Property.Array({
      displayName: 'Discussion IDs',
      description:
        "The 24-character hexadecimal discussion_id of each notification to delete, for example '6390e855e30d9209411de93b'. Get them from List Notifications.",
      required: true,
    }),
  },
  async run(context) {
    const ids = [
      ...new Set(
        hfUtils
          .toStringArray(context.propsValue.discussion_ids)
          .map((value) => hfSettingsApi.assertObjectId({ value, label: 'Discussion ID' }).toLowerCase())
      ),
    ];
    if (ids.length === 0) {
      throw new Error('Provide at least one discussion ID. Get them from List Notifications.');
    }
    await hfSettingsApi.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: '/api/notifications',
      body: { discussionIds: ids },
    });
    return {
      deleted: true,
      deleted_discussion_ids: ids,
      count: ids.length,
    };
  },
});
