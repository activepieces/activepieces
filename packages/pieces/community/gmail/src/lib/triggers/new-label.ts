import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailNewLabelTrigger = createTrigger({
    auth: gmailAuth,
    name: 'new_label',
    displayName: 'New Label Created',
    description: 'Trigger when a new label is created in Gmail.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: "Label_1",
        name: "New Project",
        type: "user"
    },

    async onEnable({ auth, store }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const response = await gmail.users.labels.list({ userId: 'me' });
        const labelIds = (response.data.labels || []).map(l => l.id).filter((id): id is string => !!id);

        await store.put('existing_labels', labelIds);
    },

    async onDisable({ store }) {
        await store.delete('existing_labels');
    },

    async run({ auth, store }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });

        const response = await gmail.users.labels.list({ userId: 'me' });
        const currentLabels = response.data.labels || [];
        const currentLabelIds = currentLabels.map(l => l.id).filter((id): id is string => !!id);

        const existingLabelIds = (await store.get<string[]>('existing_labels')) || [];

        const newLabels = currentLabels.filter(l => l.id && !existingLabelIds.includes(l.id));

        if (newLabels.length > 0) {
            await store.put('existing_labels', currentLabelIds);
        }

        return newLabels;
    },

    async test({ auth }) {
        const { access_token } = auth;
        const client = new OAuth2Client();
        client.setCredentials({ access_token });
        const gmail = google.gmail({ version: 'v1', auth: client });
        const response = await gmail.users.labels.list({ userId: 'me' });
        return (response.data.labels || []).slice(0, 5);
    }
});
