import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
    FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';

export const gmailNewStarredEmailTrigger = createTrigger({
    auth: gmailAuth,
    name: 'gmail_new_starred_email',
    displayName: 'New Starred Email',
    description: 'Triggers when an email is starred (within 2 days)',
    props: {
        subject: GmailProps.subject,
        from: GmailProps.from,
        to: GmailProps.to,
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await context.store.put('lastPoll', Date.now());
    },
    async onDisable(context) {
        return;
    },
    async run(context) {
        const lastPoll = (await context.store.get<number>('lastPoll')) ?? 0;

        const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').valueOf();
        const queryAfter = Math.max(lastPoll, twoDaysAgo);

        const query = [
            'label:starred',
            `after:${Math.floor(queryAfter / 1000)}`,
        ];
        if (context.propsValue.from) query.push(`from:(${context.propsValue.from})`);
        if (context.propsValue.to) query.push(`to:(${context.propsValue.to})`);
        if (context.propsValue.subject) query.push(`subject:(${context.propsValue.subject})`);

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const messagesResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 25,
        });

        const emails = [];
        for (const message of messagesResponse.data.messages || []) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'raw',
            });
            const parsed = await parseStream(
                Buffer.from(msg.data.raw as string, 'base64').toString('utf-8')
            );
            const msgDate = dayjs(parsed.date).valueOf();
            if (msgDate >= twoDaysAgo) {
                emails.push({
                    id: message.id!,
                    data: {
                        message: {
                            ...parsed,
                            attachments: await convertAttachment(parsed.attachments, context.files),
                        },
                    },
                });
            }
        }

        await context.store.put('lastPoll', Date.now());
        return emails;
    },
    async test(context) {
        const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').valueOf();
        const query = [
            'label:starred',
            `after:${Math.floor(twoDaysAgo / 1000)}`,
        ];
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });
        const messagesResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 5,
        });
        const emails = [];
        for (const message of messagesResponse.data.messages || []) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'raw',
            });
            const parsed = await parseStream(
                Buffer.from(msg.data.raw as string, 'base64').toString('utf-8')
            );
            emails.push({
                id: message.id!,
                data: {
                    message: {
                        ...parsed,
                        attachments: await convertAttachment(parsed.attachments, context.files),
                    },
                },
            });
        }
        return emails;
    },
});
