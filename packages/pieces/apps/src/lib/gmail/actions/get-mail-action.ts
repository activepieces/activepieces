import { createAction, Property, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework";
import { GmailMessage } from "../common/models";

export const gmailGetEmail = createAction({
  name: 'gmail_get_mail',
  description: 'Get an email from your Gmail account',
  displayName: 'Get Email',
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://accounts.google.com/o/oauth2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      required: true,
      scope: ["https://mail.google.com/"]
    }),
    message_id: Property.ShortText({
      displayName: 'MessageID',
      description: 'The messageId of the mail to read',
      required: true,
    }),
    format: Property.StaticDropdown<string>({
      displayName: 'Format',
      description: 'Format of the mail',
      required: false,
      defaultValue: 'full',
      options: {
        disabled: false,
        options: [
          { value: 'minimal', label: 'Minimal' },
          { value: 'full', label: 'Full' },
          { value: 'raw', label: 'Raw' },
          { value: 'metadata', label: 'Metadata' }
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
  async run({ propsValue: { authentication, message_id, format } }) {
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication['access_token'],
      },
      queryParams: {
        format: (format ?? 'full')
      }
    };

    const response = (await httpClient.sendRequest<GmailMessage>(request))
    console.debug("get mail response", response.body)

    if (response.status === 200) {
      return response.body
    }

    return {}
  }
})