import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Conversation } from '../common/types';

interface ConversationAssignment {
  conversation: Conversation;
  previousAssignee?: {
    id: number;
    email: string;
  };
  newAssignee: {
    id: number;
    email: string;
  };
  assignedAt: string;
}

const polling: Polling<PiecePropValueSchema<typeof helpScoutAuth>, { mailboxId?: string; userId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
    const { mailboxId, userId } = propsValue;
    
    // Get stored conversation states
    const storedConversations = ((await store.get<Record<string, any>>('conversations')) || {}) as Record<string, any>;
    
    const sinceDate = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const queryParams: any = {
      status: 'all',
      modifiedSince: sinceDate,
      sortField: 'userUpdatedAt',
      sortOrder: 'desc',
    };

    if (mailboxId) {
      queryParams.mailbox = mailboxId;
    }

    if (userId) {
      queryParams.assigned = userId;
    }

    const conversations = await helpScoutCommon.getAllPages(
      auth,
      '/conversations',
      queryParams
    );

    const updatedStoredConversations: Record<string, any> = {};
    const items: { epochMilliSeconds: number; data: ConversationAssignment }[] = [];

    for (const conversation of conversations) {
      const conversationId = conversation.id.toString();
      const previousState = storedConversations[conversationId];
      const currentAssigneeId = conversation.assignee?.id;
      
      updatedStoredConversations[conversationId] = {
        assigneeId: currentAssigneeId,
        updatedAt: conversation.userUpdatedAt,
      };

      // Check if assignment changed
      if (previousState && currentAssigneeId && previousState.assigneeId !== currentAssigneeId) {
        // Assignment changed
        items.push({
          epochMilliSeconds: new Date(conversation.userUpdatedAt).getTime(),
          data: {
            conversation,
            previousAssignee: previousState.assigneeId ? {
              id: previousState.assigneeId,
              email: previousState.assigneeEmail || '',
            } : undefined,
            newAssignee: {
              id: conversation.assignee!.id,
              email: conversation.assignee!.email,
            },
            assignedAt: conversation.userUpdatedAt,
          },
        });
      } else if (!previousState && currentAssigneeId) {
        // New conversation with assignment or first time we're seeing it
        const updatedAt = new Date(conversation.userUpdatedAt).getTime();
        if (!lastFetchEpochMS || updatedAt > lastFetchEpochMS) {
          items.push({
            epochMilliSeconds: updatedAt,
            data: {
              conversation,
              previousAssignee: undefined,
              newAssignee: {
                id: conversation.assignee!.id,
                email: conversation.assignee!.email,
              },
              assignedAt: conversation.userUpdatedAt,
            },
          });
        }
      }
    }

    // Update stored conversations
    await store.put('conversations', updatedStoredConversations);

    return items;
  },
};

export const conversationAssigned = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation-assigned',
  displayName: 'Conversation Assigned',
  description: 'Triggers when a conversation is assigned to a user',
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
    userId: Property.Dropdown({
      displayName: 'User',
      description: 'Trigger only when assigned to a specific user (leave empty for any user)',
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
          const users = await helpScoutCommon.makeRequest(
            auth,
            'GET',
            '/users'
          );

          return {
            options: [
              { label: 'Any User', value: '' },
              ...users._embedded.users.map((user: any) => ({
                label: `${user.firstName} ${user.lastName} (${user.email})`,
                value: user.id.toString(),
              })),
            ],
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load users',
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
    conversation: {
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
        id: 2,
        firstName: 'Jane',
        lastName: 'Agent',
        email: 'jane.agent@company.com',
        role: 'agent',
        timezone: 'America/New_York',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        type: 'user',
      },
      createdBy: {
        id: 100,
        type: 'customer',
        email: 'customer@example.com',
      },
      createdAt: '2024-01-15T10:30:00Z',
      userUpdatedAt: '2024-01-15T14:45:00Z',
      source: {
        type: 'email',
        via: 'customer',
      },
      primaryCustomer: {
        id: 100,
        firstName: 'John',
        lastName: 'Customer',
        email: 'customer@example.com',
        createdAt: '2023-12-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
    previousAssignee: {
      id: 1,
      email: 'john.doe@company.com',
    },
    newAssignee: {
      id: 2,
      email: 'jane.agent@company.com',
    },
    assignedAt: '2024-01-15T14:45:00Z',
  },
});