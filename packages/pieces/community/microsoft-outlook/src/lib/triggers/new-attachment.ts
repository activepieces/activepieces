import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
    OAuth2PropertyValue,
    PiecePropValueSchema,
    Property,
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Attachment, Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, { folder?: string }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const folderId = propsValue.folder || 'inbox';
        
        const filter = `hasAttachments eq true` + (lastFetchEpochMS > 0 ? ` and receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}` : '');

        const response: PageCollection = await client
            .api(`/me/mailFolders/${folderId}/messages`)
            .filter(filter)
            .expand('attachments')
            .orderby('receivedDateTime asc')
            .get();

        const items: { epochMilliSeconds: number; data: unknown }[] = [];

        for (const message of response.value as Message[]) {
            if (message.attachments && message.attachments.length > 0) {
                for (const attachment of message.attachments as Attachment[]) {
                    // Use attachment's modification time for precise deduplication
                    const epoch = dayjs(attachment.lastModifiedDateTime).valueOf();
                    
                    // Remove bulky/unnecessary message properties before returning
                    const { attachments, body, bodyPreview, uniqueBody, ...messageInfo } = message;

                    items.push({
                        epochMilliSeconds: epoch,
                        data: {
                            ...attachment,
                            message: messageInfo, // Nest parent message info
                        }
                    });
                }
            }
        }
        return items;
    },
};

export const newAttachmentTrigger = createTrigger({
    auth: microsoftOutlookAuth,
    name: 'new_attachment',
    displayName: 'New Attachment',
    description: 'Triggers when a new attachment is received in an email.',
    props: {
        folder: Property.Dropdown({
            displayName: 'Folder',
            description: 'The folder to monitor for new attachments. Defaults to Inbox.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                const authProp = auth as OAuth2PropertyValue;
                const client = Client.initWithMiddleware({
                    authProvider: { getAccessToken: () => Promise.resolve(authProp.access_token) },
                });
                const response = await client.api('/me/mailFolders').top(100).get();
                return {
                    disabled: false,
                    options: response.value.map((folder: { displayName: string; id: string }) => ({
                        label: folder.displayName,
                        value: folder.id,
                    })),
                };
            },
        }),
    },
    sampleData: {
        "@odata.type": "#microsoft.graph.fileAttachment",
        "id": "AAMkAGUzY5QKjAAABEgAQAMkpJI_X-LBFgvrv1PlZYd8=",
        "lastModifiedDateTime": "2023-01-02T03:41:29Z",
        "name": "sales-invoice.docx",
        "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "size": 13068,
        "isInline": false,
        "contentBytes": "UEsDBBQABgAIAAAAIQ4AAAAA",
        "message": {
            "id": "AAMkAGUzY5QKjAAA=",
            "subject": "Q4 Sales Invoice",
            "from": {
                "emailAddress": {
                    "name": "Adele Vance",
                    "address": "adelev@contoso.com"
                }
            },
            "receivedDateTime": "2023-01-02T03:40:08Z"
        }
    },
    type: TriggerStrategy.POLLING,
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});