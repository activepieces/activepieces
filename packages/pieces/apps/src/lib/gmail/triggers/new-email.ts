import { createTrigger, TriggerStrategy } from '@activepieces/framework';
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
    subject: GmailProps.subject(true),
    from: GmailProps.from(),
    to: GmailProps.to(),
    label: GmailProps.label(),
    category: GmailProps.category()
  },
  sampleData: {
    "messages": [
      {
        "id": "150c7d689ef7cdf7",
        "threadId": "150c7d689ef7cdf7"
      }
    ],
    "resultSizeEstimate": 1
  },
  type: TriggerStrategy.POLLING,
  async onEnable({ store }) {
    const last_read = dayjs().unix()

    await store?.put<TriggerData>('gmail_new_email_trigger', {
      last_read
    });
  },
  async onDisable({ store }) {  
    await store.put('gmail_new_email_trigger', null);
  },
  async run({ store, propsValue: { authentication, from, to, subject, label, category } }) {
    const data = await store.get<TriggerData>('gmail_new_email_trigger');
    const now  = dayjs().unix();

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
    return [response.body]
  }
});


interface TriggerData {
  last_read: number
}