
import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firestoreAuth } from '../common/auth';
import dayjs from 'dayjs';

const polling: Polling<AppConnectionValueForAuthProperty<typeof firestoreAuth>, {
  projectId?: string;
  databaseId?: string;
  collectionPath?: string;
}> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { projectId, databaseId, collectionPath } = propsValue;
        const parent = `projects/${projectId}/databases/${databaseId}/documents`;
        const url = `https://firestore.googleapis.com/v1/${parent}/${collectionPath}?pageSize=100`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
            headers: {
                Authorization: `Bearer ${auth.access_token}`,
                'Content-Type': 'application/json',
            }
        });

        const documents = response.body?.documents || [];
        return documents
            .filter((doc: any) => {
                const createTime = dayjs(doc.createTime);
                return createTime.isAfter(lastFetchEpochMS);
            })
            .map((doc: any) => ({
                epochMilliSeconds: dayjs(doc.createTime).valueOf(),
                data: doc,
            }));
        }
}

export const newDocumentWithinACollection = createTrigger({
    auth: firestoreAuth,
    name: 'newDocumentWithinACollection',
    displayName: 'New Document within a Collection',
    description: 'Trigger when a new document is created in a Firestore collection',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'Your Firebase project ID',
            required: true,
        }),
        databaseId: Property.ShortText({
            displayName: 'Database ID',
            description: 'Database ID (default is "(default)")',
            required: false,
            defaultValue: '(default)',
        }),
        collectionPath: Property.ShortText({
            displayName: 'Collection Path',
            description: 'Path to the collection to monitor (e.g., "users" or "users/user1/posts")',
            required: true,
        }),
    },
    sampleData: {
        name: 'projects/my-project/databases/(default)/documents/users/user1',
        fields: { name: { stringValue: 'John' }, age: { integerValue: 30 } },
        createTime: '2025-12-12T00:00:00Z',
        updateTime: '2025-12-12T00:00:00Z',
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