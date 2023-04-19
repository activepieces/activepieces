import { createAction, Property } from "@activepieces/pieces-framework";
import { GmailRequests } from "../common/data";
import { GmailMessageFormat } from "../common/models";
import { GmailProps } from "../common/props";

export const gmailGetEmail = createAction({
  name: 'gmail_get_mail',
  description: 'Get an email from your Gmail account via Id',
  displayName: 'Get Email',
  props: {
    authentication: GmailProps.authentication,
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The messageId of the mail to read',
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
          { value: GmailMessageFormat.METADATA, label: 'Metadata' }
        ]
      }
    })
  },
  sampleData: {
    id: '183baac18543bef8',
    threadId: '183baac18543bef8',
    labelIds: ['UNREAD', 'CATEGORY_SOCIAL', 'INBOX'],
    snippet: '',
    payload: {
      partId: '',
      mimeType: 'multipart/alternative',
      filename: '',
      headers: [
        [Object]
      ],
      body: { size: 0 },
      parts: [[Object]]
    },
    sizeEstimate: 107643,
    historyId: '99742',
    internalDate: '1665284181000'
  },
  run: async ({ propsValue: { authentication, format, message_id } }) =>
    await GmailRequests.getMail({
      access_token: authentication.access_token,
      message_id,
      format: (format ?? GmailMessageFormat.FULL)
    })
})