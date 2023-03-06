import { createAction, Property } from "@activepieces/framework";
import { GmailRequests } from "../common/data";
import { GmailMessageFormat } from "../common/models";

export const gmailGetThread = createAction({
  name: 'gmail_get_thread',
  description: 'Get a thread from your Gmail account via Id',
  displayName: 'Get Thread',
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      required: true,
      scope: ["https://mail.google.com/"]
    }),
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
  async run({ propsValue: { authentication, format, thread_id } }) {
    const mail = await GmailRequests.getThread({ 
      authentication, 
      thread_id, 
      format: (format ?? GmailMessageFormat.FULL) 
    })
  
    return mail
  }
})