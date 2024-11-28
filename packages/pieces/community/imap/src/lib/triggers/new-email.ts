import {
  FilesService,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { imapAuth } from '../..';
import { convertAttachment, imapCommon } from '../common';
import { ParsedMail } from 'mailparser';

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
    await context.store.delete('lastPoll');
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
    const filteredEmail = items
      .filter((f) => f.epochMilliSeconds > lastEpochMilliSeconds);
    return enrichAttachments(filteredEmail, files);
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
    const filteredEmails = getFirstFiveOrAll(items);
    return enrichAttachments(filteredEmails, files);
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

async function enrichAttachments(item: {
  data: ParsedMail;
  epochMilliSeconds: number;
}[], files: FilesService) {
  return Promise.all(item.map(async (item) => {

    const { attachments, ...rest } = item.data
    return {
      data:{...rest},
      epochMilliSeconds: item.epochMilliSeconds,
      attachments: await convertAttachment(item.data.attachments, files),
    }

  }));
}
function getFirstFiveOrAll<T>(array: T[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
