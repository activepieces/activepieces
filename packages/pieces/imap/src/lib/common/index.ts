import { FilesService } from '@activepieces/pieces-framework';
import imap from 'imap';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';

export const imapCommon = {
    constructConfig(auth: { host: string, username: string, password: string, port: number, tls: boolean }) {
        return {
            user: auth.username,
            password: auth.password,
            host: auth.host,
            port: auth.port,
            tls: auth.tls,
            tlsOptions: {
                rejectUnauthorized: false
            }
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
            })
            imapClient.connect();
        });
    },
    async fetchEmails({ imapConfig, range, mailbox, files }: { imapConfig: any, range: string, mailbox: string, files: FilesService }): Promise<{
        parsedEmails: ParsedMail[],
        totalMessages: number,
    }> {
        const { parsedEmails, totalMessages } = await new Promise<{ parsedEmails: ParsedMail[], totalMessages: number }>((resolve, reject) => {
            const imapClient = new imap(imapConfig);
            const parsedEmails: ParsedMail[] = [];
            let messages = 0;

            imapClient.once('ready', () => {
                imapClient.openBox(mailbox, (err, ml) => {
                    if (err) {
                        imapClient.end();
                        reject(err);
                    } else {
                        messages = ml.messages.total;
                        const listener = imapClient.seq.fetch(range, {
                            bodies: "",
                            struct: true,
                        })
                        listener.on('message', (msg, seqno) => {
                            msg.on('body', stream => {
                                simpleParser(stream, async (err, parsed) => {
                                    parsedEmails.push(parsed);
                                });
                            });
                        });
                        listener.once('end', () => {
                            imapClient.end();
                        });
                    }
                });
            });

            imapClient.once('end', () => {
                resolve({
                    parsedEmails,
                    totalMessages: messages,
                });
            });
            imapClient.once('error', (err: any) => {
                reject(err);
            });

            imapClient.connect();
        });
        const convertedItems = await Promise.all(parsedEmails.map(async (item) => {
            const castedItem = item as ParsedMail;
            return {
                ...castedItem,
                attachments: await convertAttachment(castedItem.attachments, files)
            }
        }
        ));
        return {
            parsedEmails,
            totalMessages,
        }
    },
};


async function convertAttachment(attachments: Attachment[], files: FilesService) {
    const promises = attachments.map(async (attachment) => {
        return files.write({
            fileName: attachment.filename ?? `attachment-${Date.now()}`,
            data: attachment.content,
        });
    });
    return Promise.all(promises);
}

