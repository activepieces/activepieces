import {
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { discordAuth } from '../..';
import { discordCommon } from '../common';

interface Member {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  joined_at: string;
}

const polling: Polling<string, { guildId: string | undefined; limit: number }> =
  {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue: { guildId, limit } }) => {
      if (!guildId) return [];

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://discord.com/api/v9/guilds/${guildId}/members?limit=${limit}`,
        headers: {
          Authorization: 'Bot ' + auth,
        },
      };

      const res = await httpClient.sendRequest<Member[]>(request);

      const items = res.body;
      return items.map((item) => ({
        epochMilliSeconds: dayjs(item.joined_at).valueOf(),
        data: item,
      }));
    },
  };

export const newMember = createTrigger({
  auth: discordAuth,
  name: 'new_member',
  displayName: 'New Member',
  description: 'Triggers when a new member joins a guild',
  type: TriggerStrategy.POLLING,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The number of members to fetch (max 1000)',
      required: false,
      defaultValue: 50,
    }),
    guildId: Property.ShortText({
      displayName: 'Guild ID',
      description: 'The ID of the Discord guild (server)',
      required: true,
    }),
  },
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        guildId: context.propsValue.guildId,
        limit: context.propsValue.limit ?? 50,
      },
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        guildId: context.propsValue.guildId,
        limit: context.propsValue.limit ?? 50,
      },
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        guildId: context.propsValue.guildId,
        limit: context.propsValue.limit ?? 50,
      },
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {
        guildId: context.propsValue.guildId,
        limit: context.propsValue.limit ?? 50,
      },
      files: context.files,
    });
  },
});
