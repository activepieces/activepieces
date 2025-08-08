import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleChatAuth } from '../common/auth';
import { spaceIdDropdown } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof googleChatAuth>, { space_id?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const authClient = new OAuth2Client();
    authClient.setCredentials(auth);
    const chat = google.chat({ version: 'v1', auth: authClient });

    const items: any[] = [];

    if (propsValue.space_id) {
      // Get messages from specific space
      let spaceName = propsValue.space_id;
      if (!propsValue.space_id.startsWith('spaces/')) {
        spaceName = `spaces/${propsValue.space_id}`;
      }

      const response = await chat.spaces.messages.list({
        parent: spaceName,
        pageSize: 100,
        orderBy: 'create_time desc',
      });

      if (response.data.messages) {
        items.push(...response.data.messages);
      }
    } else {
      // Get messages from all spaces
      const spacesResponse = await chat.spaces.list({
        pageSize: 100,
        filter: 'spaceType = "SPACE"',
      });

      if (spacesResponse.data.spaces) {
        for (const space of spacesResponse.data.spaces) {
          try {
            const messagesResponse = await chat.spaces.messages.list({
              parent: space.name!,
              pageSize: 50,
              orderBy: 'create_time desc',
            });

            if (messagesResponse.data.messages) {
              items.push(...messagesResponse.data.messages);
            }
          } catch (error) {
            
            continue;
          }
        }
      }
    }

    return items
      .filter(item => item.createTime && dayjs(item.createTime).valueOf() > (lastFetchEpochMS || 0))
      .map((item) => ({
        epochMilliSeconds: dayjs(item.createTime).valueOf(),
        data: {
          name: item.name,
          text: item.text,
          sender: item.sender,
          createTime: item.createTime,
          space: item.space,
          thread: item.thread,
          argumentText: item.argumentText,
          attachment: item.attachment,
          cards: item.cards,
          cardsV2: item.cardsV2,
          annotations: item.annotations,
        },
      }));
  }
};

export const newMessage = createTrigger({
  auth: googleChatAuth,
  name: 'newMessage',
  displayName: 'New Message',
  description: 'Fires when a new message is received in Google Chat',
  props: {
    space_id: Property.Dropdown({
      displayName: 'Space (Optional)',
      description: 'Select a specific space to monitor, or leave empty to monitor all spaces',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const authClient = new OAuth2Client();
          authClient.setCredentials(auth);
          const chat = google.chat({ version: 'v1', auth: authClient });
          
          const response = await chat.spaces.list({
            pageSize: 100,
            filter: 'spaceType = "SPACE"',
          });

          const options = response.data.spaces?.map((space) => ({
            label: space.displayName || space.name || 'Unnamed Space',
            value: space.name || '',
          })) || [];

          return {
            disabled: false,
            options: options,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading spaces',
          };
        }
      },
    }),
  },
  sampleData: {
    name: 'spaces/SPACE_ID/messages/MESSAGE_ID',
    text: 'Hello, this is a sample message!',
    sender: {
      name: 'users/USER_ID',
      displayName: 'John Doe',
      type: 'HUMAN',
    },
    createTime: '2023-01-01T12:00:00Z',
    space: {
      name: 'spaces/SPACE_ID',
      displayName: 'Sample Space',
    },
    thread: {
      name: 'spaces/SPACE_ID/threads/THREAD_ID',
    },
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});