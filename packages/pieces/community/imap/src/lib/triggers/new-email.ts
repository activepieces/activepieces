import {
  FilesService,
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
  tryCatch,
} from '@activepieces/pieces-framework';

import {
  type Attachment,
  type Message,
  imapAuth,
  mailboxDropdown,
  fetchEmails,
} from '../common';
import { newEmailTriggerOutputSchema } from '../output-schemas';

const FILE_SIZE_ERROR_NAME = 'FileSizeError';
const LAST_POLL_KEY = 'lastPoll';
const TEST_SAMPLE_SIZE = 5;

const filterInstructions =
  'New emails in this folder start the flow, in the order they arrived. To act on only some, add a **Router** step after this trigger.';

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
    const messages = await fetchEmails({
      auth: context.auth,
      lastPoll: 0,
      mailbox: context.propsValue.mailbox as string,
    });
    return Promise.all(
      messages
        .reverse()
        .slice(0, TEST_SAMPLE_SIZE)
        .map((message) => withStoredAttachments({ message, files: context.files }))
    );
  },

  async onEnable(context) {
    if (context.isRepublish && !isNil(await context.store.get(LAST_POLL_KEY))) {
      return;
    }
    await context.store.put(LAST_POLL_KEY, Date.now());
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const storedLastPoll = await context.store.get<number>(LAST_POLL_KEY);
    const lastPoll = Math.min(storedLastPoll ?? Date.now(), Date.now());
    const messages = await fetchEmails({
      auth: context.auth,
      lastPoll,
      mailbox: context.propsValue.mailbox as string,
    });
    const newMessages = messages.filter(
      (message) => message.epochMilliSeconds > lastPoll
    );
    const items = await Promise.all(
      newMessages.map((message) =>
        withStoredAttachments({ message, files: context.files })
      )
    );
    await context.store.put(
      LAST_POLL_KEY,
      newMessages.reduce(
        (latest, message) => Math.max(latest, message.epochMilliSeconds),
        lastPoll
      )
    );
    return items;
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

async function withStoredAttachments({
  message,
  files,
}: {
  message: Message;
  files: FilesService;
}) {
  return {
    ...message.data,
    attachments: await storeAttachments({
      attachments: message.data.attachments,
      files,
    }),
  };
}

async function storeAttachments({
  attachments,
  files,
}: {
  attachments: Attachment[];
  files: FilesService;
}): Promise<string[]> {
  const stored = await Promise.all(
    attachments.map(async (attachment) => {
      const { data, error } = await tryCatch(() =>
        files.write({
          fileName: attachment.filename ?? `attachment-${Date.now()}`,
          data: attachment.content,
        })
      );
      if (error === null) {
        return [data];
      }
      if (error.name === FILE_SIZE_ERROR_NAME) {
        return [];
      }
      throw error;
    })
  );
  return stored.flat();
}
