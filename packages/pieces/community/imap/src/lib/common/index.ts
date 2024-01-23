import { FilesService } from '@activepieces/pieces-framework';
import imap from 'imap';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';

export const imapCommon = {
  constructConfig(auth: {
    host: string;
    username: string;
    password: string;
    port: number;
    tls: boolean;
  }) {
    return {
      user: auth.username,
      password: auth.password,
      host: auth.host,
      port: auth.port,
      tls: auth.tls,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    };
  },
  async getTotalMessages(imapConfig: any, mailbox: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const imapClient = new imap(imapConfig);
      imapClient.once('ready', () => {
        imapClient.openBox(mailbox, false, (err, mailbox) => {
          if (err) {
            imapClient.end();
            reject(err);
          } else {
            const total = mailbox.messages.total;
            imapClient.end();
            resolve(total);
          }
        });
      });
      imapClient.connect();
    });
  },
  async fetchEmails({
    imapConfig,
    lastTotalMessages,
    test,
    mailbox,
    files,
  }: {
    imapConfig: any;
    lastTotalMessages: number | null;
    test: boolean;
    mailbox: string;
    files: FilesService;
  }): Promise<{
    parsedEmails: any[];
    totalMessages: number;
  }> {
    const { parsedEmails, totalMessages } = await new Promise<{
      parsedEmails: any[];
      totalMessages: number;
    }>((resolve, reject) => {
      const imapClient = new imap(imapConfig);

      imapClient.once('ready', () => {
        imapClient.openBox(mailbox, (err, ml) => {
          if (err) {
            imapClient.end();
            reject(err);
          } else {
            const messages = ml.messages.total;
            if (messages === lastTotalMessages && !test) {
              resolve({
                parsedEmails: [],
                totalMessages: messages,
              });
            } else {
              const finalEmails: any[] = [];
              const newMessages = test
                ? Math.min(5, messages)
                : messages - (lastTotalMessages ?? 0);
              const range = test
                ? `${Math.max(1, messages - 5)}:${messages}`
                : `${lastTotalMessages! + 1}:${messages}`;
              const listener = imapClient.seq.fetch(range, {
                bodies: '',
                struct: true,
              });
              listener.on('message', (msg, seqno) => {
                msg.on('body', (stream) => {
                  finalEmails.push(stream);
                  if (finalEmails.length === newMessages) {
                    imapClient.end();
                    resolve({
                      parsedEmails: finalEmails,
                      totalMessages: messages,
                    });
                  }
                });
              });
            }
          }
        });
      });

      imapClient.once('error', (err: any) => {
        reject(err);
      });

      imapClient.connect();
    });
    const convertedItems = await Promise.all(
      parsedEmails.map(async (item) => {
        const castedItem = await parseStream(item);
        return {
          ...castedItem,
          attachments: await convertAttachment(castedItem.attachments, files),
        };
      })
    );
    return {
      parsedEmails: convertedItems,
      totalMessages,
    };
  },
};

async function convertAttachment(
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

async function parseStream(stream: any) {
  return new Promise<ParsedMail>((resolve, reject) => {
    simpleParser(stream, (err, parsed) => {
      if (err) {
        reject(err);
      } else {
        resolve(parsed);
      }
    });
  });
}
