import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { projectsDropdown, spacesDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const newMessage = createTrigger({
  auth: googleChatApiAuth,
  name: 'newMessage',
  displayName: 'New Message',
  description: 'Triggers when a new message is received in Google Chat.',
  props: {
    projectId: projectsDropdown(['auth']),
    spaceId: spacesDropdown({ refreshers: ['auth'] }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ auth, propsValue, webhookUrl, store }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.newMessageTriggerSchema);

    const { projectId, spaceId } = propsValue;
    const accessToken = auth.access_token;

    const topicName = `acp-topic-${Date.now()}`;
    const subscriptionName = `acp-sub-${Date.now()}`;

    await googleChatAPIService
      .cleanupWebhookResources({
        accessToken,
        event_type: 'google.workspace.chat.message.v1.created',
        projectId: projectId as string,
      })
      .catch((err) => {
        console.log('Error cleaning up webhook resources', err);
      });

    await googleChatAPIService.createPubSubTopic({
      accessToken,
      projectId: projectId as string,
      topicName,
    });

    await googleChatAPIService.grantTopicPermissions({
      accessToken,
      projectId: projectId as string,
      topicName,
    });

    const targetResource = `//chat.googleapis.com/${
      spaceId ? spaceId : 'spaces/-'
    }`;

    await googleChatAPIService.createWebhookSubscription({
      accessToken,
      projectId: projectId as string,
      topic: topicName,
      subscriptionName,
      webhookUrl,
      eventTypes: ['google.workspace.chat.message.v1.created'],
      targetResource,
    });
  },
  async onDisable({ auth, propsValue: { projectId }, store }) {
    const accessToken = auth.access_token;

    await googleChatAPIService
      .cleanupWebhookResources({
        accessToken,
        event_type: 'google.workspace.chat.message.v1.created',
        projectId: projectId as string,
      })
      .catch((err) => {
        console.log('Error cleaning up webhook resources during disable', err);
      });
  },
  async run(context) {
    const messageData = JSON.parse(
      Buffer.from(
        (context.payload.body as any).message.data,
        'base64'
      ).toString('utf-8')
    );

    return [messageData];
  },
});
