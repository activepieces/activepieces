import {
  DropdownOption,
  FilesService,
  PiecePropValueSchema,
  Property,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import imap from 'imap';
import { imapCommon } from '../common';
import { imapAuth } from '../..';

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
    mailbox: Property.Dropdown({
      displayName: 'Mailbox',
      description: 'Select the mailbox to search',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const imapConfig = imapCommon.constructConfig(
          auth as {
            host: string;
            username: string;
            password: string;
            port: number;
            tls: boolean;
          }
        );
        const options = await new Promise<DropdownOption<string>[]>(
          (resolve, reject) => {
            const imapClient = new imap(imapConfig);
            imapClient.once('ready', () => {
              imapClient.getBoxes((err, boxes) => {
                if (err) {
                  imapClient.end();
                  reject(err);
                } else {
                  const mailboxOptions = Object.keys(boxes).map((box) => {
                    return { label: box, value: box };
                  });
                  imapClient.end();
                  resolve(mailboxOptions);
                }
              });
            });
            imapClient.once('error', (err: any) => {
              reject(err);
            });
            imapClient.connect();
          }
        );
        // Add all boxes option for gmail
        if ((auth as any).host.includes('gmail.com')) {
          options.unshift({
            label: 'All',
            value: '[Gmail]/All Mail',
          });
        }
        return {
          disabled: false,
          options: options,
        };
      },
    }),
    filterInstructions: Property.MarkDown({
      value: filterInstructions,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const totalMessage = await imapCommon.getTotalMessages(
      imapCommon.constructConfig(context.auth),
      context.propsValue.mailbox
    );
    await context.store.put<number>('_imaplastmessage', totalMessage);
  },
  onDisable: async (context) => {
    await context.store.delete('_imaplastmessage');
  },
  run: async (context) => {
    const lastMessage = (await context.store.get<number>('_imaplastmessage'))!;
    const { parsedEmails, totalMessages } = await imapCommon.fetchEmails({
      imapConfig: imapCommon.constructConfig(context.auth),
      lastTotalMessages: lastMessage,
      test: false,
      mailbox: context.propsValue.mailbox,
      files: context.files,
    });
    if (totalMessages) {
      await context.store.put<number>('_imaplastmessage', totalMessages);
    }
    return parsedEmails;
  },
  test: async (context) => {
    const { parsedEmails } = await imapCommon.fetchEmails({
      imapConfig: imapCommon.constructConfig(context.auth),
      lastTotalMessages: null,
      test: true,
      mailbox: context.propsValue.mailbox,
      files: context.files,
    });
    return parsedEmails;
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
