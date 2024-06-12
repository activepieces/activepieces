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
import { gmailAuth } from '../../';

export const gmailNewEmailTrigger = createTrigger({
  auth: gmailAuth,
  name: 'gmail_new_email_received',
  displayName: 'New Email',
  description: 'Triggers when new mail is found in your Gmail inbox',
  props: {
    from: GmailProps.from,
    to: GmailProps.to,
    label: GmailProps.label,
    category: GmailProps.category,
  },
  sampleData: {},
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
  label: GmailLabel | undefined;
  category: string | undefined;
}

const polling: Polling<PiecePropValueSchema<typeof gmailAuth>, PropsValue> = {
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
  { from, to, label, category }: PropsValue,
  auth: OAuth2PropertyValue
) {
  return (
    (
      await GmailRequests.searchMail({
        max_results: max_result,
        access_token: auth.access_token,
        from: from as string,
        to: to as string,
        subject: undefined,
        label: label as GmailLabel,
        category: category as string,
        after: after_unix_seconds,
      })
    )?.messages ?? []
  );
}
