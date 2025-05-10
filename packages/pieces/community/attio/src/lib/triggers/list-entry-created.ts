import { Property } from '@activepieces/pieces-framework';
import { createAttioWebhookTrigger } from '../common/base-webhook-trigger';
import { WebhookFilterCondition } from '../common/webhook-utils';

export const listEntryCreated = createAttioWebhookTrigger({
    name: 'listEntryCreated',
    displayName: 'List Entry Created',
    description: 'Triggers when a new list entry is created in Attio.',
    eventType: 'list-entry.created',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to monitor for new entries. Leave empty to trigger on entries in all lists.',
            required: false,
        })
    },
    sampleData: {
        "event_type": "list-entry.created",
        "id": {
            "workspace_id": "928e88d9-de10-4e1c-9aef-36b07cb4260d",
            "list_id": "69815e80-949c-44c9-92be-242457a4be28",
            "entry_id": "861c1071-54ba-4d3d-b642-f72f7bcc8c7e"
        },
        "parent_object_id": "7298c9b4-63ac-4b7e-8a74-4468d2e403a9",
        "parent_record_id": "6003a6aa-7122-45f1-b840-efe9231dfd06"
    },
    getFilterConditions: (propsValue) => {
        const filterConditions: WebhookFilterCondition[] = [];
        
        if (propsValue['listId']) {
            filterConditions.push({
                field: "id.list_id",
                operator: "equals",
                value: propsValue['listId'] as string
            });
        }
        
        return filterConditions;
    },
});