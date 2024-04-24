import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  Polling,
  pollingHelper,
  DedupeStrategy,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { GmailRequests } from '../common/data';
import { GmailLabel, GmailMessage } from '../common/models';
import { GmailProps } from '../common/props';
import { gmailDevAuth } from '../../';

export const gmailNewEmailTrigger = createTrigger({
  auth: gmailDevAuth,
  name: 'gmail_dev_new_email_received',
  displayName: 'New Email',
  description: 'Triggers when new mail is found in your Gmail inbox',
  props: {
    subject: GmailProps.subject,
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
  },
  sampleData: {
    message: {
      id: '183baac18543bef8',
      threadId: '183baac18543bef8',
      labelIds: ['UNREAD', 'CATEGORY_SOCIAL', 'INBOX'],
      snippet: '',
      payload: {
        partId: '',
        mimeType: 'multipart/alternative',
        filename: '',
        body: { size: 0 },
      },
      sizeEstimate: 107643,
      historyId: '99742',
      internalDate: '1665284181000',
    },
    body_html: '<div dir="ltr">Hello World</div>',
    body_plain: 'Hello World',
    subject: 'Hello World',
    thread: {
      id: '382baac18543beg8',
      historyId: '183baac185',
      messages: [
        {
          id: '183baac18543bef8',
          threadId: '382baac18543beg8',
          labelIds: ['UNREAD', 'CATEGORY_SOCIAL', 'INBOX'],
          snippet: '',
          payload: {
            partId: '',
            mimeType: 'multipart/alternative',
            filename: '',
            body: { size: 0 },
          },
          sizeEstimate: 107643,
          historyId: '99742',
          internalDate: '1665284181000',
        },
      ],
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable({ auth, store, propsValue }) {
    return pollingHelper.onEnable(polling, {
      auth,
      store,
      propsValue,
    });
  },
  async onDisable({ auth, store, propsValue }) {
    return pollingHelper.onDisable(polling, {
      auth,
      store,
      propsValue,
    });
  },
  async test({ auth, store, propsValue }) {
    return pollingHelper.test(polling, {
      auth,
      store,
      propsValue,
    });
  },
  async run({ auth, store, propsValue }) {
    return pollingHelper.poll(polling, {
      auth,
      store,
      propsValue,
    });
  },
});

interface PropsValue {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  label: GmailLabel | undefined;
  category: string | undefined;
}

const polling: Polling<
  PiecePropValueSchema<typeof gmailDevAuth>,
  PropsValue
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getEmail(
      lastFetchEpochMS === 0 ? 5 : 100,
      Math.floor(lastFetchEpochMS / 1000),
      propsValue,
      auth
    );
    return items.map((item) => {
      const mail = item as GmailMessage;
      return {
        epochMilliSeconds: dayjs(mail?.internalDate).valueOf(),
        data: item,
      };
    });
  },
};

async function getEmail(
  max_result: number,
  after_unix_seconds: number,
  { from, to, subject, label, category }: PropsValue,
  auth: OAuth2PropertyValue
) {
  return (
    (
      await GmailRequests.searchMail({
        max_results: max_result,
        access_token: auth.access_token,
        from: from as string,
        to: to as string,
        subject: subject as string,
        label: label as GmailLabel,
        category: category as string,
        after: after_unix_seconds,
      })
    )?.messages ?? []
  );
}
