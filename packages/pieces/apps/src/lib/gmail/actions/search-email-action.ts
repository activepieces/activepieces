import { createAction } from "@activepieces/framework";
import { GmailRequests } from "../common/data";
import { GmailLabel, GmailMessageFormat } from "../common/models";
import { GmailProps } from "../common/props";

export const gmailSearchMail = createAction({
  name: 'gmail_search_mail',
  description: 'Search for an email in your Gmail account',
  displayName: 'Search Email',
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
          "id": "183baac18543bef5",
          "threadId": "183baac18543bef5"
        },
        {
          "id": "183a213a0730fad4",
          "threadId": "183a213a0730fad4"
        },
        {
          "id": "1839579494fe34fe",
          "threadId": "1839579494fe34fe"
        },
        {
          "id": "1838bad82a2cb0f2",
          "threadId": "1838bad82a2cb0f2"
        }
      ],
      "resultSizeEstimate": 4
    }
  ],
  async run({ propsValue: { authentication, from, to, subject, label, category } }) {
    
    const response = await GmailRequests.searchMail({
      access_token: (authentication.access_token as string), 
      from: from as string, 
      to: to as string, 
      subject: subject as string, 
      label: label as GmailLabel, 
      category: category as string
    })

    return {
      messages: response
        .messages
        .map((message: {id: string, threadId: string}) => {
          return {
            message: GmailRequests.getMail({ 
              authentication, 
              message_id: message.id, 
              format: GmailMessageFormat.FULL 
            }),
            thread: GmailRequests.getThread({ 
              authentication, 
              thread_id: message.threadId,
              format: GmailMessageFormat.FULL
            }),
          }
        }),
      nextPageToken: response?.nextPageToken,
      resultSizeEstimate: response.resultSizeEstimate
    }
  }
})