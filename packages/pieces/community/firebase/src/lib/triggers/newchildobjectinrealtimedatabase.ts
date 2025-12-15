
import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firestoreAuth } from '../common/auth';
import dayjs from 'dayjs';

const polling: Polling<AppConnectionValueForAuthProperty<typeof firestoreAuth>, {
  projectId: string;
  path: string;
  timestampField?: string;
}> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { projectId, path, timestampField } = propsValue;
        const baseUrl = `https://${projectId}.firebaseio.com`;
        const cleanPath = path.replace(/^\//, '');
        const url = `${baseUrl}/${cleanPath}.json?access_token=${auth.access_token}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = response.body;
        if (!data || typeof data !== 'object') {
            return [];
        }

        const items: Array<{epochMilliSeconds: number; data: any}> = [];
        
        for (const [key, value] of Object.entries(data)) {
            let timestamp: number | null = null;

            // Try to extract timestamp from field if specified
            if (timestampField && typeof value === 'object' && value !== null) {
                const fieldValue = (value as Record<string, any>)[timestampField];
                if (typeof fieldValue === 'number') {
                    timestamp = fieldValue;
                } else if (typeof fieldValue === 'string') {
                    timestamp = dayjs(fieldValue).valueOf();
                }
            }

            // If no timestamp found, use current time (items are considered new)
            if (timestamp === null) {
                timestamp = dayjs().valueOf();
            }

            if (timestamp > lastFetchEpochMS) {
                items.push({
                    epochMilliSeconds: timestamp,
                    data: { key, value }
                });
            }
        }

        return items;
    }
}

export const newchildobjectinrealtimedatabase = createTrigger({
    auth: firestoreAuth,
    name: 'newchildobjectinrealtimedatabase',
    displayName: 'New Child Object in Realtime Database',
    description: 'Trigger when a new child object is added to a path in Firebase Realtime Database',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'Your Firebase project ID (e.g., my-project)',
            required: true,
        }),
        path: Property.ShortText({
            displayName: 'Path',
            description: 'Path to monitor for new child objects (e.g., users or posts/active)',
            required: true,
        }),
        timestampField: Property.ShortText({
            displayName: 'Timestamp Field (Optional)',
            description: 'Field name containing timestamp (e.g., createdAt). If not specified, items are considered new based on polling intervals.',
            required: false,
        }),
    },
    sampleData: {
        key: 'user123',
        value: {
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: 1702391880000
        }
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});