// 2026-11-16 +03: Message Status action (POST /API/status/): queue status of a sent message, not a delivery report.
import { createAction, Property } from '@activepieces/pieces-framework';
import { kwtsmsAuth } from '../auth';
import { callKwtsms } from '../common';

export const kwtsmsMessageStatus = createAction({
  auth: kwtsmsAuth,
  name: 'message_status',
  classification: 'READ',
  description: 'Get the queue status of a sent message.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a kwtSMS message by its msg-id (returned by Send SMS) and returns its queue status and description: pending, error in queue, or sent to gateway. This is not a delivery report. Read-only and idempotent.',
    idempotent: true,
  },
  displayName: 'Message Status',
  props: {
    msgid: Property.ShortText({
      displayName: 'Message ID',
      description: 'The msg-id returned by Send SMS.',
      required: true,
    }),
  },
  async run(context) {
    return await callKwtsms<{ status: string; description: string }>(
      'status',
      context.auth.props,
      { msgid: context.propsValue.msgid.trim() },
    );
  },
});
