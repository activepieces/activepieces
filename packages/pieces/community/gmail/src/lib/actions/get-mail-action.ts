import { createAction, Property } from '@activepieces/pieces-framework';
import { GmailRequests } from '../common/data';
import { GmailMessageFormat } from '../common/models';
import { gmailAuth } from '../../';

export const gmailGetEmail = createAction({
  auth: gmailAuth,
  name: 'gmail_get_mail',
  description: 'Get an email from your Gmail account via Id',
  displayName: 'Get Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The messageId of the mail to read',
      required: true,
    }),
    format: Property.StaticDropdown<GmailMessageFormat>({
      displayName: 'Format',
      description: 'Format of the mail',
      required: false,
      defaultValue: GmailMessageFormat.FULL,
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
  run: async ({ auth, propsValue: { format, message_id } }) =>
    await GmailRequests.getMail({
      access_token: auth.access_token,
      message_id,
      format: format ?? GmailMessageFormat.FULL,
    }),
});
