import { createTrigger } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import dayjs from 'dayjs';
import { GmailRequests } from '../common/data';
import { GmailLabel } from '../common/models';
import { GmailProps } from '../common/props';

export const gmailNewEmailTrigger = createTrigger({
  name: 'gmail_new_email_received',
  displayName: 'New Email',
  description: 'Triggers when new mail is found in your Gmail inbox',
  props: {
    authentication: GmailProps.authentication,
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category
  },
  sampleData: {
    "message": {
      "id": '183baac18543bef8',
      "threadId": '183baac18543bef8',
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
    },
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
  },
  type: TriggerStrategy.POLLING,
  async onEnable({ store }) {
    const last_read = dayjs().unix()

    await store?.put<TriggerData>('gmail_new_email_trigger', {
      last_read
    });
  },
  async onDisable({ store }) {
    await store.put('gmail_new_email_trigger', undefined);
  },
  async run({ store, propsValue: { authentication, from, to, subject, label, category } }) {
    const data = await store.get<TriggerData>('gmail_new_email_trigger');
    const now = dayjs().unix();

    const response = await GmailRequests.searchMail({
      access_token: (authentication.access_token as string),
      from: from as string,
      to: to as string,
      subject: subject as string,
      label: label as GmailLabel,
      category: category as string,
      after: data?.last_read,
      before: now
    })

    await store?.put<TriggerData>('gmail_new_email_trigger', { last_read: now })
    return response.messages;
  }
});


interface TriggerData {
  last_read: number
}
