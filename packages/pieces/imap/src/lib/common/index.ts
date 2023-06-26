import { Property } from "@activepieces/pieces-framework";

import imap from 'node-imap';
import { simpleParser } from 'mailparser';

export const imapCommon = {
    authentication: Property.CustomAuth({
        displayName: 'Authentication',
        description: 'Enter your IMAP server authentication details',
        props: {
            host: Property.ShortText({
                displayName: 'Host',
                description: 'The host of the IMAP server',
                required: true,
            }),
            username: Property.ShortText({
                displayName: 'Username',
                description: 'The username of the IMAP server',
                required: true,
            }),
            password: Property.SecretText({
                displayName: 'Password',
                description: 'The password of the IMAP server',
                required: true,
            }),
            port: Property.Number({
                displayName: 'Port',
                description: 'The port of the IMAP server',
                required: true,
                defaultValue: 143,
            }),
            tls: Property.Checkbox({
                displayName: 'Use TLS',
                defaultValue: false,
                required: true,
            }),
        },
        required: true
    }),
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