import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Conversation, Tag } from '../common/types';

interface TagUpdate {
  conversation: Conversation;
  previousTags: Tag[];
  currentTags: Tag[];
  addedTags: Tag[];
  removedTags: Tag[];
  updatedAt: string;
}

const polling: Polling<PiecePropValueSchema<typeof helpScoutAuth>, { mailboxId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
    const { mailboxId } = propsValue;
    
    // Get stored conversation tags
    const storedTags = ((await store.get<Record<string, Tag[]>>('conversationTags')) || {}) as Record<string, Tag[]>;
    
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

    const conversations = await helpScoutCommon.getAllPages(
      auth,
      '/conversations',
      queryParams
    );

    const updatedStoredTags: Record<string, Tag[]> = {};
    const items: { epochMilliSeconds: number; data: TagUpdate }[] = [];

    for (const conversation of conversations) {
      const conversationId = conversation.id.toString();
      const currentTags = conversation.tags || [];
      const previousTags = storedTags[conversationId] || [];
      
      updatedStoredTags[conversationId] = currentTags;

      // Compare tags
      const previousTagIds = new Set(previousTags.map((t: any) => t.id));
      const currentTagIds = new Set(currentTags.map((t: any) => t.id));

      const addedTags = currentTags.filter((t: any) => !previousTagIds.has(t.id));
      const removedTags = previousTags.filter((t: any) => !currentTagIds.has(t.id));

      // Only trigger if tags actually changed
      if (addedTags.length > 0 || removedTags.length > 0) {
        const updatedAt = new Date(conversation.userUpdatedAt).getTime();
        if (!lastFetchEpochMS || updatedAt > lastFetchEpochMS) {
          items.push({
            epochMilliSeconds: updatedAt,
            data: {
              conversation,
              previousTags,
              currentTags,
              addedTags,
              removedTags,
              updatedAt: conversation.userUpdatedAt,
            },
          });
        }
      }
    }

    // Update stored tags
    await store.put('conversationTags', updatedStoredTags);

    return items;
  },
};

export const tagsUpdated = createTrigger({
  auth: helpScoutAuth,
  name: 'tags-updated',
  displayName: 'Tags Updated',
  description: 'Triggers when tags on a conversation are added or removed',
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
    conversation: {
      id: 123456,
      number: 1001,
      threads: 2,
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
        id: 100,
        type: 'customer',
        email: 'customer@example.com',
      },
      createdAt: '2024-01-15T10:30:00Z',
      userUpdatedAt: '2024-01-15T15:00:00Z',
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
        {
          id: 3,
          name: 'billing',
          color: '#00ff00',
          slug: 'billing',
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
    previousTags: [
      {
        id: 1,
        name: 'urgent',
        color: '#ff0000',
        slug: 'urgent',
      },
      {
        id: 2,
        name: 'support',
        color: '#0000ff',
        slug: 'support',
      },
    ],
    currentTags: [
      {
        id: 1,
        name: 'urgent',
        color: '#ff0000',
        slug: 'urgent',
      },
      {
        id: 3,
        name: 'billing',
        color: '#00ff00',
        slug: 'billing',
      },
    ],
    addedTags: [
      {
        id: 3,
        name: 'billing',
        color: '#00ff00',
        slug: 'billing',
      },
    ],
    removedTags: [
      {
        id: 2,
        name: 'support',
        color: '#0000ff',
        slug: 'support',
      },
    ],
    updatedAt: '2024-01-15T15:00:00Z',
  },
});