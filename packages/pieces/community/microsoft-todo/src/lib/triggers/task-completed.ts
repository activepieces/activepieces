import { OAuth2PropertyValue, Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import dayjs from 'dayjs';
import { TodoTask } from '@microsoft/microsoft-graph-types';


interface WebhookNotification {
    value: {
        resource: string;
        resourceData?: {
            id: string;
        };
    }[];
}

export const taskCompletedTrigger = createTrigger({
    auth: microsoftToDoAuth,
    name: 'task_completed',
    displayName: 'Task Completed',
    description: 'Triggers when a task is completed in a specific list.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The list to watch for completed tasks.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const authValue = auth as OAuth2PropertyValue;
                if (!authValue?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(authValue);
            },
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        '@odata.etag': 'W/"vVwdQvxCiE6779iYhchMrAAGgwrltg=="',
        importance: 'normal',
        isReminderOn: false,
        status: 'completed',
        title: 'Test Task',
    },

    async onEnable(context) {
        try {
            const client = Client.initWithMiddleware({
                authProvider: { getAccessToken: () => Promise.resolve(context.auth.access_token) },
            });

            const clientState = Math.random().toString(36).substring(7);
            const expirationDateTime = dayjs().add(2, 'days').toISOString();
            
            const response = await client.api('/subscriptions').post({
                changeType: 'updated',
                notificationUrl: context.webhookUrl,
                resource: `/me/todo/lists/${context.propsValue.task_list_id}/tasks`,
                expirationDateTime: expirationDateTime,
                clientState: clientState,
            });

            await context.store.put('subscriptionId', response.id);
            await context.store.put('clientState', clientState);
        } catch (error: any) {
            throw new Error(`Failed to create webhook subscription: ${error?.message || error}`);
        }
    },

    async onDisable(context) {
        try {
            const subscriptionId = await context.store.get('subscriptionId') as string | null;
            if (subscriptionId) {
                const client = Client.initWithMiddleware({
                    authProvider: { getAccessToken: () => Promise.resolve(context.auth.access_token) },
                });
                await client.api(`/subscriptions/${subscriptionId}`).delete();
                await context.store.delete('subscriptionId');
                await context.store.delete('clientState');
            }
        } catch (error: any) {
            console.warn(`Failed to delete subscription: ${error?.message || error}`);
        }
    },

    async onRenew(context) {
        try {
            const subscriptionId = await context.store.get('subscriptionId') as string | null;
            if (subscriptionId) {
                const client = Client.initWithMiddleware({
                    authProvider: { getAccessToken: () => Promise.resolve(context.auth.access_token) },
                });
                await client.api(`/subscriptions/${subscriptionId}`).patch({
                    expirationDateTime: dayjs().add(2, 'days').toISOString(),
                });
            }
        } catch (error: any) {
            throw new Error(`Failed to renew subscription: ${error?.message || error}`);
        }
    },

    async run(context) {
        const payload = context.payload.body as WebhookNotification;
        
        const storedClientState = await context.store.get('clientState') as string | null;
        const receivedClientState = (context.payload.body as any)?.value?.[0]?.clientState;
        
        if (storedClientState && receivedClientState !== storedClientState) {
            console.warn('Invalid clientState received in webhook notification');
            return [];
        }

        const completedTasks: TodoTask[] = [];

        const client = Client.initWithMiddleware({
            authProvider: { getAccessToken: () => Promise.resolve(context.auth.access_token) },
        });
        
        for (const notification of payload.value) {
            const taskId = notification.resourceData?.id;
            if (!taskId) continue;

            try {
                const task = await client.api(notification.resource).get() as TodoTask;
                
                if (task.status === 'completed') {
                    completedTasks.push(task);
                }
            } catch (e) {
                console.warn(`Failed to fetch task ${taskId}, it may have been deleted.`);
            }
        }

        return completedTasks;
    },
});