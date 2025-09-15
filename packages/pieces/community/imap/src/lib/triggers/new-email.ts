import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  FilesService,
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

import {
  type Attachment,
  type Message,
  imapAuth,
  mailboxDropdown,
  fetchEmails,
} from '../common';

const filterInstructions = `
**Emails Filtering:**

Add a Router Piece to filter emails based on the subject, to, from, cc or other fields.
`;

const props = {
  mailbox: mailboxDropdown({
    displayName: 'Mailbox',
    description: 'Select the mailbox to search.',
    required: true,
  }),
  filterInstructions: Property.MarkDown({
    value: filterInstructions,
  }),
};

const polling: Polling<
  PiecePropValueSchema<typeof imapAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS: lastPoll }) => {
    const { mailbox } = propsValue;
    const records = await fetchEmails({
      auth,
      lastPoll,
      mailbox: mailbox as string,
    });

    return records.map((record) => ({
      epochMilliSeconds: record.epochMilliSeconds,
      data: record,
    }));
  },
};

export const newEmail = createTrigger({
  auth: imapAuth,
  name: 'new_email',
  displayName: 'New Email',
  description: 'Trigger when a new email is received',
  props,
  type: TriggerStrategy.POLLING,

  async test(context) {
    const messages = await pollingHelper.test(polling, context);
    return enrichAttachments(messages as Message[], context.files);
  },

  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    const messages = await pollingHelper.poll(polling, context);
    return enrichAttachments(messages as Message[], context.files);
  },

  sampleData: {
    html: '<p>My email body</p>',
    text: 'My email body',
    attachments: [],
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
    uid: 123,
  },
});

export async function convertAttachment(
  attachments: Attachment[],
  files: FilesService
) {
  const promises = attachments.map(async (attachment) => {
    return files.write({
      fileName: attachment.filename ?? `attachment-${Date.now()}`,
      data: attachment.content,
    });
  });

  return Promise.all(promises);
}

async function enrichAttachments(items: Message[], files: FilesService) {
  return Promise.all(
    items.map(async (item) => {
      const { attachments, ...rest } = item.data;
      const convertedAttachments = attachments
        ? await convertAttachment(attachments, files)
        : [];

      return {
        data: { ...rest },
        epochMilliSeconds: item.epochMilliSeconds,
        attachments: convertedAttachments,
      };
    })
  );
}
