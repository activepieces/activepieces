import { Property } from '@activepieces/pieces-framework';
import { createAttioWebhookTrigger } from '../common/base-webhook-trigger';
import { WebhookFilterCondition } from '../common/webhook-utils';

export const listEntryUpdated = createAttioWebhookTrigger({
    name: 'listEntryUpdated',
    displayName: 'List Entry Updated',
    description: 'Triggers when a list entry is updated in Attio.',
    eventType: 'list-entry.updated',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to monitor for updated entries. Leave empty to trigger on entries in all lists.',
            required: false,
        }),
        attributeId: Property.ShortText({
            displayName: 'Attribute ID',
            description: 'Optional: The ID of the specific attribute to monitor for changes. Leave empty to trigger on any attribute update.',
            required: false,
        })
    },
    sampleData: {
        "event_type": "list-entry.updated",
        "id": {
            "workspace_id": "928e88d9-de10-4e1c-9aef-36b07cb4260d",
            "list_id": "69815e80-949c-44c9-92be-242457a4be28",
            "entry_id": "861c1071-54ba-4d3d-b642-f72f7bcc8c7e",
            "attribute_id": "18b7bb8c-fc41-4b70-be0b-0dea00b3ca23"
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
        
        if (propsValue['attributeId']) {
            filterConditions.push({
                field: "id.attribute_id",
                operator: "equals",
                value: propsValue['attributeId'] as string
            });
        }
        
        return filterConditions;
    },
}); 