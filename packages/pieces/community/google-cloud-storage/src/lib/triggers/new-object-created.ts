import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';

export const newObjectCreated = createTrigger({
  auth: googleCloudStorageAuth,
  name: 'new_object_created',
  displayName: 'New Object Created',
  description: 'Triggers when a new object is created in a bucket.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    prefix: Property.ShortText({
        displayName: 'Prefix (Folder Path)',
        description: "Only trigger for objects created with this prefix. For example, 'images/uploads/' to watch a specific 'folder'.",
        required: false,
    }),
  },
  sampleData: {
    "kind": "storage#object",
    "id": "your-bucket/path/to/new-file.txt/1634567890123456",
    "name": "path/to/new-file.txt",
    "bucket": "your-bucket",
    "generation": "1634567890123456",
    "contentType": "text/plain",
    "timeCreated": "2025-10-15T14:30:00.000Z",
    "updated": "2025-10-15T14:30:00.000Z",
    "size": "123"
  },
  type: TriggerStrategy.WEBHOOK,
  
  async onEnable(context) {
    const client = new GoogleCloudStorageClient((context.auth as OAuth2PropertyValue).access_token);
    const uniqueId = context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);

    const topicName = `ap-new-object-${uniqueId}`;
    const subscriptionName = `ap-new-object-sub-${uniqueId}`;

    await client.createPubSubTopic(context.propsValue.project, topicName);
    await client.grantTopicPermissions(context.propsValue.project, topicName);

    const notification = await client.createBucketNotification(
        context.propsValue.bucket,
        topicName,
        context.propsValue.project,
        ['OBJECT_FINALIZE']
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
    if (!context.payload.body) {
        return [];
    }

    const message = (context.payload.body as any).message;
    if (message && message.data) {
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