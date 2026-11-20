import { createAction } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';
import { sentProps } from '../common/props';
import { sentValues } from '../common/values';

export const getMessageActivities = createAction({
  auth: sentAuth,
  name: 'get_message_activities',
  classification: 'READ',
  displayName: 'Get Message Activities',
  description: 'Get lifecycle events and activity details for a Sent message.',
  audience: 'both',
  aiMetadata: {
    description:
      'Inspect the delivery history of one message using its message ID. Safe to retry.',
    idempotent: true,
  },
  props: { message_id: sentProps.messageId, profile_id: sentProps.profile },
  run: async ({ auth, propsValue }) =>
    sentApi.request({
      apiKey: auth.secret_text,
      path: `/messages/${encodeURIComponent(
        sentValues.requiredString({
          value: propsValue.message_id,
          label: 'Get Message Activities ID',
        })
      )}/activities`,
      profileId: propsValue.profile_id,
    }),
});
