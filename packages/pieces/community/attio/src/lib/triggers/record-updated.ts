import { Property } from '@activepieces/pieces-framework';
import { createAttioWebhookTrigger } from '../common/base-webhook-trigger';
import { WebhookFilterCondition } from '../common/webhook-utils';

export const recordUpdated = createAttioWebhookTrigger({
    name: 'recordUpdated',
    displayName: 'Record Updated',
    description: 'Triggers when a record is updated in Attio.',
    eventType: 'record.updated',
    props: {
        objectTypeId: Property.ShortText({
            displayName: 'Object Type ID',
            description: 'The ID of the object type to monitor for updated records. Leave empty to trigger on all object types.',
            required: false,
        }),
        attributeId: Property.ShortText({
            displayName: 'Attribute ID',
            description: 'Optional: The ID of the specific attribute to monitor for changes. Leave empty to trigger on any attribute update.',
            required: false,
        })
    },
    sampleData: {
        "event_type": "record.updated",
        "id": {
            "workspace_id": "928e88d9-de10-4e1c-9aef-36b07cb4260d",
            "object_type_id": "7298c9b4-63ac-4b7e-8a74-4468d2e403a9",
            "record_id": "6003a6aa-7122-45f1-b840-efe9231dfd06",
            "attribute_id": "18b7bb8c-fc41-4b70-be0b-0dea00b3ca23"
        }
    },
    getFilterConditions: (propsValue) => {
        const filterConditions: WebhookFilterCondition[] = [];
        
        if (propsValue['objectTypeId']) {
            filterConditions.push({
                field: "id.object_type_id",
                operator: "equals",
                value: propsValue['objectTypeId'] as string
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