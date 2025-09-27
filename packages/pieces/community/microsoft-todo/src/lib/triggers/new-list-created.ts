import { OAuth2PropertyValue, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';


interface WebhookNotification {
    value: {
        resourceData?: {
            id: string;
        };
    }[];
}

export const newListCreatedTrigger = createTrigger({
    auth: microsoftToDoAuth,
    name: 'new_list_created',
    displayName: 'New List',
    description: 'Triggers when a new task list is created.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "@odata.etag": "W/\"m19slk90924jJPD1941jla=\"",
        "displayName": "Vacation Plans",
        "isOwner": true,
        "isShared": false,
        "wellknownListName": "none",
        "id": "AAMkAGI2NGY3NTY0LTZmYjEtNDk0MS04YjQ5LTFlNmQ5NjI1MWI5ZgAuAAAAAAC50Fk_sKMfS5_62i1Isws2AQD3xL9-24sxT5RO4265g_AEAAB3x24kAAA="
    },

    async onEnable(context) {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        const expirationDateTime = dayjs().add(2, 'days').toISOString();

        const response = await client.api('/subscriptions').post({
            changeType: 'created',
            notificationUrl: context.webhookUrl,
            resource: '/me/todo/lists',
            expirationDateTime: expirationDateTime,

        });

        await context.store.put('subscriptionId', response.id);
    },

    async onDisable(context) {

        const subscriptionId = await context.store.get('subscriptionId') as string | null;
        if (subscriptionId) {
            const client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: () => Promise.resolve(context.auth.access_token),
                },
            });
            await client.api(`/subscriptions/${subscriptionId}`).delete();
            await context.store.delete('subscriptionId');
        }
    },

    async run(context) {

        const payload = context.payload.body as WebhookNotification;
        const notifications = payload.value;
        const listData = [];

        for (const notification of notifications) {
            if (notification.resourceData && notification.resourceData.id) {
                 const client = Client.initWithMiddleware({
                    authProvider: {
                        getAccessToken: () => Promise.resolve(context.auth.access_token),
                    },
                });

                try {
                    const listDetails = await client.api(`/me/todo/lists/${notification.resourceData.id}`).get();
                    listData.push(listDetails);
                } catch(e) {
                    console.warn(`Could not fetch list ${notification.resourceData.id}, it may have been deleted.`);
                }
            }
        }
        return listData;
    },

    async onRenew(context) {

        const subscriptionId = await context.store.get('subscriptionId') as string | null;
        if (subscriptionId) {
            const client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: () => Promise.resolve(context.auth.access_token),
                },
            });
            const newExpiration = dayjs().add(2, 'days').toISOString();
            await client.api(`/subscriptions/${subscriptionId}`).update({
                expirationDateTime: newExpiration,
            });
        }
    },
});