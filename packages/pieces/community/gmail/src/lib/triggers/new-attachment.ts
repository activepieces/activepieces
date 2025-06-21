import {
    createTrigger,
    TriggerStrategy,
    FilesService,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { parseStream, convertAttachment } from '../common/data';

export const gmailNewAttachmentTrigger = createTrigger({
    auth: gmailAuth,
    name: 'gmail_new_attachment',
    displayName: 'New Attachment',
    description: 'Triggers when an email with an attachment arrives (with optional filters)',
    props: {
        subject: GmailProps.subject,
        from: GmailProps.from,
        to: GmailProps.to,
        label: GmailProps.label,
        category: GmailProps.category,
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

        const query = [`after:${Math.floor(queryAfter / 1000)}`];
        if (context.propsValue.from) query.push(`from:(${context.propsValue.from})`);
        if (context.propsValue.to) query.push(`to:(${context.propsValue.to})`);
        if (context.propsValue.subject) query.push(`subject:(${context.propsValue.subject})`);
        if (context.propsValue.label) query.push(`label:${context.propsValue.label.name}`);
        if (context.propsValue.category) query.push(`category:${context.propsValue.category}`);

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);
        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const messagesResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 25,
        });

        const results = [];
        for (const message of messagesResponse.data.messages || []) {
            const msgDetail = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full',
            });

            const payload = msgDetail.data.payload;
            const attachments = (payload?.parts ?? []).filter(
                (part) => !!part.filename && part.filename.length > 0 && part.body?.attachmentId
            );

            if (attachments.length > 0) {
                const rawMessageResp = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'raw',
                });
                const parsed = await parseStream(
                    Buffer.from(rawMessageResp.data.raw as string, 'base64').toString('utf-8')
                );

                results.push({
                    id: message.id!,
                    data: {
                        message: {
                            ...parsed,
                            attachments: await convertAttachment(parsed.attachments, context.files),
                        },
                        gmailMetadata: msgDetail.data,
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

        const messagesResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query.join(' '),
            maxResults: 10,
        });

        const results = [];
        for (const message of messagesResponse.data.messages || []) {
            const msgDetail = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full',
            });
            const payload = msgDetail.data.payload;
            const attachments = (payload?.parts ?? []).filter(
                (part) => !!part.filename && part.filename.length > 0 && part.body?.attachmentId
            );
            if (attachments.length > 0) {
                const rawMessageResp = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'raw',
                });
                const parsed = await parseStream(
                    Buffer.from(rawMessageResp.data.raw as string, 'base64').toString('utf-8')
                );
                results.push({
                    id: message.id!,
                    data: {
                        message: {
                            ...parsed,
                            attachments: await convertAttachment(parsed.attachments, context.files),
                        },
                        gmailMetadata: msgDetail.data,
                    },
                });
                if (results.length >= 5) break;
            }
        }
        return results;
    },
});
