import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewConversationTrigger = createTrigger({
    auth: gmailAuth,
    name: 'gmail_new_conversation',
    displayName: 'New Conversation',
    description: 'Triggers when a new conversation (thread) begins',
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
        const query = [];

        const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').valueOf();
        const queryAfter = Math.max(lastPoll, twoDaysAgo);
        query.push(`after:${Math.floor(queryAfter / 1000)}`);

        if (context.propsValue.from) query.push(`from:(${context.propsValue.from})`);
        if (context.propsValue.to) query.push(`to:(${context.propsValue.to})`);
        if (context.propsValue.subject) query.push(`subject:(${context.propsValue.subject})`);

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const threadsResponse = await gmail.users.threads.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 25,
        });

        const results = [];
        for (const thread of threadsResponse.data.threads || []) {
            const threadDetail = await gmail.users.threads.get({
                userId: 'me',
                id: thread.id!,
                format: 'full',
            });

            const firstMessage = threadDetail.data.messages?.[0];
            const firstMessageDateHeader = firstMessage?.payload?.headers?.find(
                (h) => h.name && h.name.toLowerCase() === 'date'
            );
            const headerValue: string | undefined = firstMessageDateHeader?.value ?? undefined;
            let threadStartDate = 0;
            if (headerValue) {
                const parsed = new Date(headerValue);
                threadStartDate = isNaN(parsed.getTime()) ? 0 : parsed.getTime();
            }
            if (threadStartDate >= queryAfter) {
                results.push({
                    id: thread.id!,
                    data: {
                        thread: threadDetail.data,
                        firstMessage,
                    },
                });
            }
        }

        await context.store.put('lastPoll', Date.now());
        return results;
    },
    async test(context) {
        const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').valueOf();
        const query = [`after:${Math.floor(twoDaysAgo / 1000)}`];
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const threadsResponse = await gmail.users.threads.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 5,
        });

        const results = [];
        for (const thread of threadsResponse.data.threads || []) {
            const threadDetail = await gmail.users.threads.get({
                userId: 'me',
                id: thread.id!,
                format: 'full',
            });
            const firstMessage = threadDetail.data.messages?.[0];
            results.push({
                id: thread.id!,
                data: {
                    thread: threadDetail.data,
                    firstMessage,
                },
            });
        }
        return results;
    },
});
