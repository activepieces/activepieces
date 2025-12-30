import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { enrichGmailMessage } from '../common/data';

export const gmailNewAttachmentTrigger = createTrigger({
    auth: gmailAuth,
    name: 'new_attachment',
    displayName: 'New Attachment',
    description: 'Trigger when a new email with an attachment is received.',
    props: {
        from: GmailProps.from,
        to: GmailProps.to,
        subject: GmailProps.subject,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},

    async onEnable({ auth, store }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const watchResponse = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                labelIds: ['INBOX'],
                topicName: `projects/${process.env['GCLOUD_PROJECT_ID']}/topics/${process.env['GCLOUD_TOPIC_NAME']!}`,
                labelFilterAction: 'include',
            },
        });

        await store.put('watch', watchResponse.data);
        return { items: [] };
    },

    async onDisable({ auth, store }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });
        const watchData = await store.get('watch');
        if (watchData) {
            await gmail.users.stop({ userId: 'me' });
            await store.delete('watch');
        }
    },

    async run() { return []; },

    async onHandshake() {
        return { status: 200, body: {} };
    },

    async onWebhook(context) {
        const { auth, payload, files } = context;
        const { access_token } = auth as { access_token: string };
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const messageData = JSON.parse(
            Buffer.from((payload.body as any).message.data, 'base64').toString()
        );
        const historyId = messageData.historyId;

        const history = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: historyId,
            historyTypes: ['messageAdded'],
        });

        if (!history.data.history) return [];

        const newMessages = history.data.history
            .flatMap((h) => h.messagesAdded || [])
            .map((ma) => ma.message)
            .filter((m): m is any => !!m);

        const enrichedMessages = await Promise.all(
            newMessages.map((m) => enrichGmailMessage({ gmail, messageId: m.id, files }))
        );

        // Filter only those with attachments
        return enrichedMessages.filter(msg => msg.attachments && msg.attachments.length > 0);
    },
});
