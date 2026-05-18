import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

interface TriggerData {
  topicName: string;
  subscriptionName: string;
  notificationId: string;
}

export const objectUpdated = createTrigger({
  auth: googleCloudStorageAuth,
  name: 'object_updated',
  displayName: 'Object Updated',
  description: 'Triggers when an existing object is updated in a bucket',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Only trigger for objects with this prefix',
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    kind: 'storage#object',
    id: 'example-bucket/example-object/1234567890',
    name: 'example-object.txt',
    bucket: 'example-bucket',
    generation: '1234567890',
    contentType: 'text/plain',
    timeCreated: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T01:00:00.000Z',
    size: '2048',
  },
  onEnable: async (context) => {
    const { projectId, bucket, prefix } = context.propsValue;
    const auth = context.auth;

    // Generate unique names for this trigger instance
    const triggerId = `ap-gcs-update-${bucket}-${Date.now()}`;
    const topicName = `projects/${projectId}/topics/${triggerId}`;
    const subscriptionName = `projects/${projectId}/subscriptions/${triggerId}`;

    try {
      // 1. Create Pub/Sub topic
      await gcsCommon.makePubSubRequest(
        HttpMethod.PUT,
        `/projects/${projectId}/topics/${triggerId}`,
        auth.access_token
      );

      // 2. Create GCS notification configuration for metadata updates
      const notificationConfig: any = {
        topic: topicName,
        payload_format: 'JSON_API_V1',
        event_types: ['OBJECT_METADATA_UPDATE'],
      };

      if (prefix) {
        notificationConfig.object_name_prefix = prefix;
      }

      const notificationResponse = await gcsCommon.makeGCSRequest(
        HttpMethod.POST,
        `/b/${bucket}/notificationConfigs`,
        auth.access_token,
        notificationConfig
      );

      // 3. Create Pub/Sub subscription with webhook push
      const subscriptionConfig = {
        topic: topicName,
        pushConfig: {
          pushEndpoint: context.webhookUrl,
        },
        ackDeadlineSeconds: 60,
      };

      await gcsCommon.makePubSubRequest(
        HttpMethod.PUT,
        `/projects/${projectId}/subscriptions/${triggerId}`,
        auth.access_token,
        subscriptionConfig
      );

      // Store trigger data for cleanup
      await context.store.put<TriggerData>('_trigger', {
        topicName: triggerId,
        subscriptionName: triggerId,
        notificationId: notificationResponse.id,
      });

    } catch (error) {
      // Cleanup on failure
      try {
        await gcsCommon.makePubSubRequest(
          HttpMethod.DELETE,
          `/projects/${projectId}/subscriptions/${triggerId}`,
          auth.access_token
        );
      } catch (e) { /* ignore */ }

      try {
        await gcsCommon.makePubSubRequest(
          HttpMethod.DELETE,
          `/projects/${projectId}/topics/${triggerId}`,
          auth.access_token
        );
      } catch (e) { /* ignore */ }

      throw new Error(`Failed to setup Pub/Sub notifications: ${(error as any)?.message || 'Unknown error'}`);
    }
  },
  onDisable: async (context) => {
    const triggerData = await context.store.get<TriggerData>('_trigger');
    if (!triggerData) return;

    const { projectId } = context.propsValue;
    const { bucket } = context.propsValue;
    const auth = context.auth;

    // Clean up in reverse order
    try {
      // Delete subscription
      await gcsCommon.makePubSubRequest(
        HttpMethod.DELETE,
        `/projects/${projectId}/subscriptions/${triggerData.subscriptionName}`,
        auth.access_token
      );
    } catch (e) { /* ignore */ }

    try {
      // Delete notification config
      await gcsCommon.makeGCSRequest(
        HttpMethod.DELETE,
        `/b/${bucket}/notificationConfigs/${triggerData.notificationId}`,
        auth.access_token
      );
    } catch (e) { /* ignore */ }

    try {
      // Delete topic
      await gcsCommon.makePubSubRequest(
        HttpMethod.DELETE,
        `/projects/${projectId}/topics/${triggerData.topicName}`,
        auth.access_token
      );
    } catch (e) { /* ignore */ }
  },
  run: async (context) => {
    const payload = context.payload.body as any;

    if (!payload?.message?.data) {
      return [];
    }

    // Decode Pub/Sub message
    const messageData = JSON.parse(
      Buffer.from(payload.message.data, 'base64').toString()
    );

    // Extract GCS object from notification payload
    const gcsObject = messageData;

    return [gcsObject];
  },
});