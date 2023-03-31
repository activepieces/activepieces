import { createAction } from "@activepieces/framework";
import { GmailRequests } from "../common/data";
import { GmailLabel } from "../common/models";
import { GmailProps } from "../common/props";

export const gmailSearchMail = createAction({
  name: 'gmail_search_mail',
  description: 'Find for an email in your Gmail account',
  displayName: 'Find Email',
  props: {
    authentication: GmailProps.authentication,
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category
  },
  sampleData: [
    {
      "messages": [
        {
          "thread": {
            "id": '382baac18543beg8',
            "historyId": '183baac185',
            "messages": [
              {
                "id": '183baac18543bef8',
                "threadId": '382baac18543beg8',
                "labelIds": ['UNREAD', 'CATEGORY_SOCIAL', 'INBOX'],
                "snippet": '',
                "payload": {
                  "partId": '',
                  "mimeType": 'multipart/alternative',
                  "filename": '',
                  "headers": [[Object]],
                  "body": { size: 0 },
                  "parts": [[Object]]
                },
                "sizeEstimate": 107643,
                "historyId": '99742',
                "internalDate": '1665284181000'
              }
            ]
          },
          "message": {
            "id": '183baac18543bef8',
            "threadId": '382baac18543beg8',
            "labelIds": ['UNREAD', 'CATEGORY_SOCIAL', 'INBOX'],
            "snippet": '',
            "payload": {
              "partId": '',
              "mimeType": 'multipart/alternative',
              "filename": '',
              "headers": [
                [Object]
              ],
              "body": { size: 0 },
              "parts": [[Object]]
            },
            "sizeEstimate": 107643,
            "historyId": '99742',
            "internalDate": '1665284181000'
          }
        }
      ],
      "resultSizeEstimate": 1
    }
  ],
  run: async ({ propsValue: { authentication, from, to, subject, label, category } }) => 
    await GmailRequests.searchMail({
      access_token: (authentication.access_token as string), 
      from: from as string, 
      to: to as string, 
      subject: subject as string, 
      label: label as GmailLabel, 
      category: category as string
    })
})