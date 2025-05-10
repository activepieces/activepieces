import { Property } from '@activepieces/pieces-framework';
import { createAttioWebhookTrigger } from '../common/base-webhook-trigger';
import { WebhookFilterCondition } from '../common/webhook-utils';

export const recordCreated = createAttioWebhookTrigger({
    name: 'recordCreated',
    displayName: 'Record Created',
    description: 'Triggers when a new record is created in Attio.',
    eventType: 'record.created',
    props: {
        objectTypeId: Property.ShortText({
            displayName: 'Object Type ID',
            description: 'The ID of the object type to monitor for new records. Leave empty to trigger on all object types.',
            required: false,
        }),
    },
    sampleData: {
        "event_type": "record.created",
        "id": {
            "workspace_id": "928e88d9-de10-4e1c-9aef-36b07cb4260d",
            "object_type_id": "7298c9b4-63ac-4b7e-8a74-4468d2e403a9",
            "record_id": "6003a6aa-7122-45f1-b840-efe9231dfd06"
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
        
        return filterConditions;
    },
}); 