import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from '@activepieces/pieces-framework';
import {  Polling, pollingHelper, DedupeStrategy } from "@activepieces/pieces-common";
import dayjs from 'dayjs';
import { GmailRequests } from '../common/data';
import { GmailLabel, GmailMessage } from '../common/models';
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
        "body": { size: 0 },
      },
      "sizeEstimate": 107643,
      "historyId": '99742',
      "internalDate": '1665284181000'
    },
    "body_html": "<div dir=\"ltr\">Hello World</div>",
    "body_plain": "Hello World",
    "subject": "Hello World",
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
            "body": { size: 0 },
          },
          "sizeEstimate": 107643,
          "historyId": '99742',
          "internalDate": '1665284181000'
        }
      ]
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable({ store, propsValue}) {
    return pollingHelper.onEnable(polling, {
      store,
      propsValue
    });
  },
  async onDisable({ store, propsValue }) {
    return pollingHelper.onDisable(polling, {
      store,
      propsValue
    });
  },
  async test({ store, propsValue }) {
    return pollingHelper.test(polling, {
      store,
      propsValue
    });
  },
  async run({ store, propsValue }) {
    return pollingHelper.poll(polling, {
      store,
      propsValue
    });
  }
});


interface PropsValue {
  authentication: OAuth2PropertyValue,
  from: string | undefined,
  to: string | undefined,
  subject: string | undefined,
  label: GmailLabel | undefined,
  category: string | undefined

}

const polling: Polling<PropsValue> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS }) => {
    const items = await getEmail(lastFetchEpochMS === 0 ? 5 : 100, Math.floor(lastFetchEpochMS / 1000), propsValue);
    return items.map((item) => {
      const mail = item as GmailMessage;
      return {
        epochMilliSeconds: dayjs(mail?.internalDate).valueOf(),
        data: item,
      }
    });
  }
}


async function getEmail(max_result: number, after_unix_seconds: number, { authentication, from, to, subject, label, category, }: PropsValue) {
  return (await GmailRequests.searchMail({
    max_results: max_result,
    access_token: (authentication.access_token as string),
    from: from as string,
    to: to as string,
    subject: subject as string,
    label: label as GmailLabel,
    category: category as string,
    after: after_unix_seconds
  }))?.messages ?? [];
}
