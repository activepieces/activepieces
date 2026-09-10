import { createAction } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentProps } from '../common/props';
import { sentValues } from '../common/values';

export const getMessageStatus = createAction({
  auth: sentAuth,
  name: 'get_message_status',
  classification: 'READ',
  displayName: 'Get Message Status',
  description: 'Get the current status and details of a Sent message.',
  audience: 'both',
  aiMetadata: {
    description:
      'Track an accepted message by its message ID. A successful send response does not prove delivery. Safe to retry.',
    idempotent: true,
  },
  props: { message_id: sentProps.messageId, profile_id: sentProps.profile },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: `/messages/${encodeURIComponent(
        sentValues.requiredString({
          value: propsValue.message_id,
          label: 'Get Message Status ID',
        })
      )}`,
      profileId: propsValue.profile_id,
    }),
});
