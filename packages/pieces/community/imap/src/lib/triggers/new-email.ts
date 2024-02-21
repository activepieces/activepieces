import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { imapAuth } from '../..';
import { imapCommon } from '../common';

const filterInstructions = `
**Filter Emails:**

You can add Branch Piece to filter emails based on the subject, to, from, cc or other fields.
`;

export const newEmail = createTrigger({
  auth: imapAuth,
  name: 'new_email',
  displayName: 'New Email',
  description: 'Trigger when a new email is received.',
  props: {
    mailbox: imapCommon.mailbox,
    filterInstructions: Property.MarkDown({
      value: filterInstructions,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await context.store.put('lastPoll', Date.now());
  },
  onDisable: async (context) => {
    return;
  },
  run: async (context) => {
    const { auth, store, propsValue, files } = context;
    const mailbox = propsValue.mailbox;
    const lastEpochMilliSeconds = (await store.get<number>('lastPoll')) ?? 0;
    const items = await imapCommon.fetchEmails({
      auth,
      lastEpochMilliSeconds,
      mailbox,
      files,
    });
    const newLastEpochMilliSeconds = items.reduce(
      (acc, item) => Math.max(acc, item.epochMilliSeconds),
      lastEpochMilliSeconds
    );
    await store.put('lastPoll', newLastEpochMilliSeconds);
    return items
      .filter((f) => f.epochMilliSeconds > lastEpochMilliSeconds)
      .map((item) => item.data);
  },
  test: async (context) => {
    const { auth, propsValue, files } = context;
    const mailbox = propsValue.mailbox;
    const lastEpochMilliSeconds = 0;
    const items = await imapCommon.fetchEmails({
      auth,
      lastEpochMilliSeconds,
      mailbox,
      files,
    });
    return getFirstFiveOrAll(items.map((item) => item.data));
  },
  sampleData: {
    html: 'My email body',
    text: 'My email body',
    textAsHtml: '<p>My email body</p>',
    subject: 'Email Subject',
    date: '2023-06-18T11:30:09.000Z',
    to: {
      value: [
        {
          address: 'email@address.com',
          name: 'Name',
        },
      ],
    },
    from: {
      value: [
        {
          address: 'email@address.com',
          name: 'Name',
        },
      ],
    },
    cc: {
      value: [
        {
          address: 'email@address.com',
          name: 'Name',
        },
      ],
    },
    messageId:
      '<CxE49ifJT5YZN9OE2O6j6Ef+BYgkKWq7X-deg483GkM1ui1xj3g@mail.gmail.com>',
  },
});

function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
