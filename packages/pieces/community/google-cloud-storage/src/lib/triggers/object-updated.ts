import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';

export const objectUpdated = createTrigger({
  auth: googleCloudStorageAuth,
  name: 'object_updated',
  displayName: 'Object Updated',
  description: 'Triggers when an existing object is updated.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    event_type: Property.StaticDropdown({
        displayName: 'Update Type',
        description: 'The specific update event to trigger on.',
        required: true,
        options: {
            options: [
                { label: 'Content Updated (File Overwritten)', value: 'OBJECT_FINALIZE' },
                { label: 'Metadata Updated', value: 'OBJECT_METADATA_UPDATE' },
            ]
        },
        defaultValue: 'OBJECT_FINALIZE'
    }),
    prefix: Property.ShortText({
        displayName: 'Prefix (Folder Path)',
        description: "Only trigger for objects with this prefix. For example, 'documents/invoices/'.",
        required: false,
    }),
  },
  sampleData: {
    "kind": "storage#object",
    "id": "your-bucket/path/to/updated-file.txt/1634567890123456",
    "name": "path/to/updated-file.txt",
    "bucket": "your-bucket",
    "generation": "1634567890123456",
    "metageneration": "2",
    "contentType": "text/plain",
    "timeCreated": "2025-10-15T14:30:00.000Z",
    "updated": "2025-10-15T14:45:00.000Z",
    "size": "456"
  },
  type: TriggerStrategy.WEBHOOK,
  
  async onEnable(context) {
    const client = new GoogleCloudStorageClient((context.auth as OAuth2PropertyValue).access_token);
    const uniqueId = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);

    const topicName = `ap-obj-updated-${uniqueId}`;
    const subscriptionName = `ap-obj-updated-sub-${uniqueId}`;

    await client.createPubSubTopic(context.propsValue.project, topicName);
    await client.grantTopicPermissions(context.propsValue.project, topicName);
    
    const notification = await client.createBucketNotification(
        context.propsValue.bucket,
        topicName,
        context.propsValue.project,
        [context.propsValue.event_type]
    );

    await client.createPubSubSubscription(context.propsValue.project, topicName, subscriptionName, context.webhookUrl);

    await context.store.put('trigger_data', {
        topicName: topicName,
        subscriptionName: subscriptionName,
        notificationId: notification.id,
    });
  },

  async onDisable(context) {
    const client = new GoogleCloudStorageClient((context.auth as OAuth2PropertyValue).access_token);
    const triggerData = await context.store.get<{ topicName: string; subscriptionName: string; notificationId: string }>('trigger_data');

    if (triggerData) {
        await client.deleteBucketNotification(context.propsValue.bucket, triggerData.notificationId);
        await client.deletePubSubSubscription(context.propsValue.project, triggerData.subscriptionName);
        await client.deletePubSubTopic(context.propsValue.project, triggerData.topicName);
    }
  },

  async run(context) {
    const message = (context.payload.body as any)?.message;
    if (message?.data) {
        const decodedData = JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8'));
        
        if (context.propsValue.prefix) {
            if (decodedData.name.startsWith(context.propsValue.prefix)) {
                return [decodedData];
            }
            return [];
        }
        return [decodedData];
    }
    return [];
  },
});