import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  FilesService,
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
import { newEmailTriggerOutputSchema } from '../output-schemas';

const filterInstructions =
  'New emails in this folder start the flow. An email whose sent date is older than the last check is skipped. To act on only some, add a **Router** step after this trigger.';

const props = {
  mailbox: mailboxDropdown({
    displayName: 'Folder',
    description: 'Folder to watch for new emails.',
    required: true,
  }),
  filterInstructions: Property.MarkDown({
    value: filterInstructions,
  }),
};

const polling: Polling<
 AppConnectionValueForAuthProperty<typeof imapAuth>,
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

const testPolling: typeof polling = {
  ...polling,
  items: async (...args) => {
    const messages = await polling.items(...args);
    return messages.reverse();
  },
};

export const newEmail = createTrigger({
  auth: imapAuth,
  name: 'new_email',
  classification: 'READ',
  displayName: 'New Email',
  description: 'Starts the flow when a new email arrives in a folder.',
  outputSchema: newEmailTriggerOutputSchema,
  aiMetadata: {
    description: 'Fires when a new email arrives in the selected IMAP mailbox folder. Polls the folder on an interval and emits one event per newly received message, including its parsed content and any attachments. Represents an inbound email landing in that mailbox.',
  },
  props,
  type: TriggerStrategy.POLLING,

  async test(context) {
    const messages = await pollingHelper.test(testPolling, context);
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
        ...rest,
        attachments: convertedAttachments,
      };
    })
  );
}
