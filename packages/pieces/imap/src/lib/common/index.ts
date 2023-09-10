import { Property } from "@activepieces/pieces-framework";

import imap from 'node-imap';
import { ParsedMail, simpleParser } from 'mailparser';
import { isNil } from "@activepieces/shared";

export const imapCommon = {
    subject: Property.ShortText({
        displayName: 'Subject',
        description: 'Search for a specific value in the Subject field',
        required: false,
    }),
    to: Property.ShortText({
        displayName: 'To',
        description: 'Search for a specific value in the To field',
        required: false,
    }),
    from: Property.ShortText({
        displayName: 'From',
        description: 'Search for a specific value in the From field',
        required: false,
    }),

    async fetchEmails(imapConfig: any, search: { flag: string, since: any[], subject: string | undefined, to: string | undefined, from: string | undefined }): Promise<ParsedMail[]> {
        return new Promise(resolve => {
            const imapClient = new imap(imapConfig);
            const emails: ParsedMail[] = [];
            imapClient.once('ready', () => {
                imapClient.openBox('INBOX', true, (error, box) => {
                    if (error) {
                        console.log(error);
                        imapClient.end();
                    }

                    const searchArray = [
                        search.flag,
                        search.since
                    ];
                    if (search.subject != '' && !isNil(search.subject)) searchArray.push(['SUBJECT', search.subject, 'i']);
                    if (search.to != '' && !isNil(search.to)) searchArray.push(['TO', search.to]);
                    if (search.from != '' && !isNil(search.from)) searchArray.push(['FROM', search.from]);

                    imapClient.search(searchArray, (error, results) => {
                        try {
                            const f = imapClient.fetch(results, { bodies: '' });

                            f.on('message', msg => {
                                msg.on('body', stream => {
                                    simpleParser(stream, async (err, parsed) => {

                                        emails.push(parsed);
                                    });
                                });
                            });

                            f.once('error', error => {
                                console.log(error);
                            })
                            f.once('end', () => {
                                imapClient.end();
                            })
                        }
                        catch (error) {
                            console.log(error);
                            imapClient.end();
                        }
                    });
                });
            });
            imapClient.once('error', error => {
                console.log(error);
                imapClient.end();
            });
            imapClient.once('end', () => {
                resolve(emails);
            });

            imapClient.connect();
        });
    },
}
