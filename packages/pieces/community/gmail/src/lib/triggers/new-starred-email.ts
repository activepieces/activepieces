import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { GmailProps } from '../common/props';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { enrichGmailMessage } from '../common/data';

export const gmailNewStarredEmailTrigger = createTrigger({
    auth: gmailAuth,
    name: 'new_starred_email',
    displayName: 'New Starred Email',
    description: 'Trigger when an email is starred.',
    props: {
        from: GmailProps.from,
        to: GmailProps.to,
        subject: GmailProps.subject,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},

    async onEnable({ auth, propsValue, store }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        // Watch specifically for the STARRED label
        const watchResponse = await gmail.users.watch({
            userId: 'me',
            requestBody: {
                labelIds: ['STARRED'],
                topicName: `projects/${process.env['GCLOUD_PROJECT_ID']
                    }/topics/${process.env['GCLOUD_TOPIC_NAME']!}`,
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

    async run({ auth, propsValue, files }) {
        // Standard polling fallback or manual run
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const { from, to, subject } = propsValue;
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: `${buildQuery({ from, to, subject })} is:starred`,
            maxResults: 10,
        });

        if (response.data.messages) {
            return await Promise.all(
                response.data.messages.map((message) =>
                    enrichGmailMessage({ gmail, messageId: message.id!, files })
                )
            );
        }
        return [];
    },

    async onHandshake() {
        return { status: 200, body: {} };
    },

    async onWebhook(context) {
        const { auth, payload, files, propsValue } = context;
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
            historyTypes: ['labelAdded'],
        });

        if (!history.data.history) return [];

        const starredMessages = history.data.history
            .flatMap((h) => h.labelsAdded || [])
            .filter((la) => la.labelIds?.includes('STARRED'))
            .map((la) => la.message?.id)
            .filter((id): id is string => !!id);

        return await Promise.all(
            starredMessages.map((id) =>
                enrichGmailMessage({ gmail, messageId: id, files })
            )
        );
    },
});

function buildQuery({
    from,
    to,
    subject,
}: {
    from?: string;
    to?: string;
    subject?: string;
}): string {
    let query = '';
    if (from) query += `from:(${from}) `;
    if (to) query += `to:(${to}) `;
    if (subject) query += `subject:(${subject}) `;
    return query.trim();
}
