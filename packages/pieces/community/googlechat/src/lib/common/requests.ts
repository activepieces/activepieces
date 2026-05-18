import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { GOOGLE_SERVICE_ENTITIES } from './constants';

async function fireHttpRequest({
  method,
  path,
  entity,
  body,
  accessToken,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  entity: keyof typeof GOOGLE_SERVICE_ENTITIES;
  body?: unknown;
}) {
  const BASE_URL = `https://${GOOGLE_SERVICE_ENTITIES[entity]}.googleapis.com`;

  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    })
    .then((res) => res.body)
    .catch((err) => {
      throw new Error(err);
    });
}

export const googleChatAPIService = {
  async fetchProjects(accessToken: string) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: '/v1/projects',
      entity: 'cloudresourcemanager',
      accessToken,
    });

    return response.projects;
  },
  async sendMessage({
    accessToken,
    spaceId,
    text,
    thread,
    messageReplyOption,
    customMessageId,
    isPrivate,
    privateMessageViewer,
  }: {
    accessToken: string;
    spaceId: string;
    text: string;
    thread?: string;
    messageReplyOption?: string;
    customMessageId?: string;
    isPrivate?: boolean;
    privateMessageViewer?: string;
  }) {
    const body: any = { text };

    if (thread) {
      body.thread = { name: thread };
    }

    if (messageReplyOption) {
      body.messageReplyOption = messageReplyOption;
    }

    if (customMessageId) {
      const cleanId = customMessageId.toLowerCase().replace(/[^a-z0-9-]/g, '');
      body.messageId = `client-${cleanId}`;
    }

    if (isPrivate && privateMessageViewer) {
      body.privateMessageViewer = { name: privateMessageViewer };
    }

    return await fireHttpRequest({
      method: HttpMethod.POST,
      entity: 'chat',
      accessToken,
      path: `/v1/${spaceId}/messages`,
      body,
    });
  },
  async AddASpaceMember({
    accessToken,
    spaceId,
    userId,
  }: {
    accessToken: string;
    spaceId: string;
    userId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      accessToken: accessToken,
      entity: 'chat',
      path: `/v1/${spaceId}/members`,
      body: {
        member: {
          name: userId,
          type: 'HUMAN',
        },
      },
    });
  },
  async getMessage(accessToken: string, messageName: string) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      entity: 'chat',
      accessToken,
      path: `/v1/${messageName}`,
    });
  },
  async getSpace({
    accessToken,
    spaceId,
  }: {
    accessToken: string;
    spaceId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      entity: 'chat',
      path: `/v1/${spaceId}`,
      accessToken,
    });
  },
  async listMessages(
    accessToken: string,
    spaceId: string,
    pageSize = 50
  ) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      entity: 'chat',
      accessToken,
      path: `/v1/${spaceId}/messages?pageSize=${pageSize}`,
    });
  },
  async fetchAllSpaces(accessToken: string) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/spaces`,
      entity: 'chat',
      accessToken,
    });

    return response.spaces;
  },
  async fetchSpaces(accessToken: string) {
    const filter = encodeURIComponent('spaceType = "SPACE"');
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/spaces?filter=${filter}`,
      entity: 'chat',
      accessToken,
    });

    return response.spaces;
  },
  async fetchDirectMessages(accessToken: string) {
    const filter = encodeURIComponent('spaceType = "DIRECT_MESSAGE"');
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/spaces?filter=${filter}`,
      entity: 'chat',
      accessToken,
    });

    return response.spaces;
  },
  async fetchThreads(accessToken: string, spaceId: string) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/${spaceId}/messages?pageSize=50`,
      entity: 'chat',
      accessToken,
    });

    const threads = new Map();
    response.messages?.forEach((message: any) => {
      if (message.thread && message.thread.name && !message.threadReply) {
        threads.set(message.thread.name, {
          name: message.thread.name,
          displayName: message.text?.substring(0, 50) + (message.text?.length > 50 ? '...' : ''),
          lastActivity: message.createTime,
        });
      }
    });

    return Array.from(threads.values());
  },
  async fetchSpaceMembers(accessToken: string, spaceId: string) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/${spaceId}/members`,
      entity: 'chat',
      accessToken,
    });

    return response.memberships;
  },
  async fetchPeople(accessToken: string) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/v1/people:listDirectoryPeople?sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_CONTACT&readMask=names,emailAddresses`,
      entity: 'people',
      accessToken,
    });

    return response.people;
  },
  async deleteWorkspaceEventsSubscription({
    accessToken,
    subscriptionName,
  }: {
    accessToken: string;
    subscriptionName: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.DELETE,
      entity: 'workspaceevents',
      accessToken,
      path: `/v1/${subscriptionName}`,
    });
  },
  async grantTopicPermissions({
    accessToken,
    projectId,
    topicName,
  }: {
    accessToken: string;
    projectId: string;
    topicName: string;
  }) {
    const policy = {
      bindings: [
        {
          role: 'roles/pubsub.publisher',
          members: [`serviceAccount:chat-api-push@system.gserviceaccount.com`],
        },
      ],
    };

    return await fireHttpRequest({
      method: HttpMethod.POST,
      entity: 'pubsub',
      accessToken,
      path: `/v1/projects/${projectId}/topics/${topicName}:setIamPolicy`,
      body: { policy },
    });
  },
  async createPubSubTopic({
    accessToken,
    projectId,
    topicName,
  }: {
    accessToken: string;
    projectId: string;
    topicName: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      entity: 'pubsub',
      accessToken,
      path: `/v1/projects/${projectId}/topics/${topicName}`,
    });
  },
  async deletePubSubTopic({
    accessToken,
    projectId,
    topicName,
  }: {
    accessToken: string;
    projectId: string;
    topicName: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.DELETE,
      entity: 'pubsub',
      accessToken,
      path: `/v1/projects/${projectId}/topics/${topicName}`,
    });
  },
  async createWorkspaceEventsSubscription({
    accessToken,
    projectId,
    subscriptionName,
    targetResource,
    eventTypes,
    topicName,
    includeResource = false,
  }: {
    accessToken: string;
    projectId: string;
    subscriptionName: string;
    targetResource: string;
    eventTypes: string[];
    topicName: string;
    includeResource?: boolean;
  }) {
    const subscription = {
      targetResource,
      eventTypes,
      notificationEndpoint: {
        pubsubTopic: `projects/${projectId}/topics/${topicName}`,
      },
      payloadOptions: {
        includeResource,
      },
    };

    return await fireHttpRequest({
      method: HttpMethod.POST,
      entity: 'workspaceevents',
      accessToken,
      path: `/v1/subscriptions`,
      body: subscription,
    });
  },
  async createPubSubSubscription({
    accessToken,
    projectId,
    subscriptionName,
    topicName,
    pushEndpoint,
  }: {
    accessToken: string;
    projectId: string;
    subscriptionName: string;
    topicName: string;
    pushEndpoint: string;
  }) {
    const subscription = {
      topic: `projects/${projectId}/topics/${topicName}`,
      pushConfig: {
        pushEndpoint,
      },
      ackDeadlineSeconds: 600,
    };

    return await fireHttpRequest({
      method: HttpMethod.PUT,
      entity: 'pubsub',
      accessToken,
      path: `/v1/projects/${projectId}/subscriptions/${subscriptionName}`,
      body: subscription,
    });
  },
  async createWebhookSubscription({
    accessToken,
    projectId,
    topic,
    subscriptionName,
    webhookUrl,
    eventTypes,
    targetResource,
  }: {
    accessToken: string;
    projectId: string;
    topic: string;
    webhookUrl: string;
    subscriptionName: string;
    eventTypes: string[];
    targetResource: string;
  }) {
    const workspaceSubscription = await this.createWorkspaceEventsSubscription({
      accessToken,
      projectId,
      subscriptionName,
      targetResource,
      eventTypes,
      topicName: topic,
      includeResource: true,
    });

    const pubsubSubscription = await this.createPubSubSubscription({
      accessToken,
      projectId,
      subscriptionName,
      topicName: topic,
      pushEndpoint: webhookUrl,
    });

    return {
      workspaceSubscription,
      pubsubSubscription,
    };
  },
  async deletePubSubSubscription({
    accessToken,
    projectId,
    subscriptionName,
  }: {
    accessToken: string;
    projectId: string;
    subscriptionName: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.DELETE,
      entity: 'pubsub',
      accessToken,
      path: `/v1/projects/${projectId}/subscriptions/${subscriptionName}`,
    });
  },
  async deleteWebhookSubscription({
    accessToken,
    projectId,
    subscriptionName,
    topicName,
    event_type,
  }: {
    accessToken: string;
    projectId: string;
    subscriptionName: string;
    topicName: string;
    event_type: string;
  }) {
    return await this.cleanupWebhookResources({
      accessToken,
      projectId,
      event_type,
    });
  },
  async fetchWorkSpaceSubscriptions({
    accessToken,
    event_type,
  }: {
    accessToken: string;
    event_type: string;
  }) {
    const response = await fireHttpRequest({
      method: HttpMethod.GET,
      entity: 'workspaceevents',
      accessToken,
      path: `/v1/subscriptions?filter=event_types:"${event_type}"`,
    });

    return response.subscriptions;
  },
  async cleanupWebhookResources({
    accessToken,
    projectId,
    event_type,
  }: {
    accessToken: string;
    projectId: string;
    event_type: string;
  }) {
    try {
      const workspaceSubscriptions = await this.fetchWorkSpaceSubscriptions({
        accessToken,
        event_type,
      });

      for (const sub of workspaceSubscriptions || []) {
        try {
          await this.deleteWorkspaceEventsSubscription({
            accessToken,
            subscriptionName: sub.name,
          });
        } catch (err: any) {
          console.log(err);
        }
      }
    } catch (err: any) {
      console.error('Error cleaning up workspace subscriptions:', err);
      throw err;
    }
  },
};
