import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Conversation } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof helpScoutAuth>, { mailboxId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const mailboxId = propsValue.mailboxId;
    
    // Calculate the time window for fetching conversations
    const sinceDate = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default to last 24 hours

    const queryParams: any = {
      status: 'all',
      modifiedSince: sinceDate,
      sortField: 'createdAt',
      sortOrder: 'desc',
    };

    if (mailboxId) {
      queryParams.mailbox = mailboxId;
    }

    const conversations = await helpScoutCommon.getAllPages(
      auth,
      '/conversations',
      queryParams
    );

    // Filter only newly created conversations (not just modified) and return in correct format
    const items: { epochMilliSeconds: number; data: Conversation }[] = [];
    for (const conversation of conversations) {
      const createdAt = new Date(conversation.createdAt).getTime();
      if (!lastFetchEpochMS || createdAt > lastFetchEpochMS) {
        items.push({
          epochMilliSeconds: createdAt,
          data: conversation,
        });
      }
    }

    return items;
  },
};

export const conversationCreated = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation-created',
  displayName: 'Conversation Created',
  description: 'Triggers when a new conversation is created in Help Scout',
  props: {
    mailboxId: Property.Dropdown({
      displayName: 'Mailbox',
      description: 'Select a specific mailbox to monitor (leave empty for all mailboxes)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Help Scout account',
            options: [],
          };
        }

        try {
          const mailboxes = await helpScoutCommon.makeRequest(
            auth,
            'GET',
            '/mailboxes'
          );

          return {
            options: [
              { label: 'All Mailboxes', value: '' },
              ...mailboxes._embedded.mailboxes.map((mailbox: any) => ({
                label: mailbox.name,
                value: mailbox.id.toString(),
              })),
            ],
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load mailboxes',
            options: [],
          };
        }
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 123456,
    number: 1001,
    threads: 1,
    type: 'email',
    folderId: 1,
    status: 'active',
    state: 'published',
    subject: 'Need help with my order',
    preview: 'Hi, I placed an order yesterday but haven\'t received a confirmation...',
    mailboxId: 1,
    assignee: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      role: 'agent',
      timezone: 'America/New_York',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      type: 'user',
    },
    createdBy: {
      id: 2,
      type: 'customer',
      email: 'customer@example.com',
    },
    createdAt: '2024-01-15T10:30:00Z',
    userUpdatedAt: '2024-01-15T10:30:00Z',
    source: {
      type: 'email',
      via: 'customer',
    },
    tags: [
      {
        id: 1,
        name: 'urgent',
        color: '#ff0000',
        slug: 'urgent',
      },
    ],
    primaryCustomer: {
      id: 100,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      createdAt: '2023-12-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  },
});