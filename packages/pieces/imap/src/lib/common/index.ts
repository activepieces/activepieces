import { Property } from "@activepieces/pieces-framework";

import imap from 'node-imap';
import { simpleParser } from 'mailparser';

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

    async fetchEmails(imapConfig: any, search: { flag: string, since: any[], subject: string | undefined, to: string | undefined, from: string | undefined }): Promise<any[]> {
        return new Promise(resolve => {
            const imapClient = new imap(imapConfig);
            const emails: any[] = [];
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
                    if (search.subject != '' && search.subject != undefined) searchArray.push(['SUBJECT', search.subject]);
                    if (search.to != '' && search.to != undefined) searchArray.push(['TO', search.to]);
                    if (search.from != '' && search.from != undefined) searchArray.push(['FROM', search.from]);

                    imapClient.search(searchArray, (error, results) => {
                        try {
                            const f = imapClient.fetch(results, { bodies: '' });

                            f.on('message', msg => {
                                msg.on('body', stream => {
                                    simpleParser(stream, async (error, parsed) => {
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
