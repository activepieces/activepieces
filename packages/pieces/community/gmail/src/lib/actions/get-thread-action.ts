import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { GmailMessageFormat } from '../common/models';
import { gmailAuth } from '../../';

export const gmailGetThread = createAction({
  auth: gmailAuth,
  name: 'gmail_get_thread',
  description: 'Get a thread from your Gmail account via Id',
  displayName: 'Get Thread',
  props: {
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The thread Id of the mail to read',
      required: true,
    }),
    format: Property.StaticDropdown<GmailMessageFormat>({
      displayName: 'Format',
      description: 'Format of the mail',
      required: false,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          { value: GmailMessageFormat.MINIMAL, label: 'Minimal' },
          { value: GmailMessageFormat.FULL, label: 'Full' },
          { value: GmailMessageFormat.RAW, label: 'Raw' },
          { value: GmailMessageFormat.METADATA, label: 'Metadata' },
        ],
      },
    }),
  },
  run: async ({ auth, propsValue: { format, thread_id } }) =>
    await GmailRequests.getThread({
      access_token: auth.access_token,
      thread_id,
      format: format ?? GmailMessageFormat.FULL,
    }),
});
