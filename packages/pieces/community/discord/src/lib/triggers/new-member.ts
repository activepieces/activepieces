import {
  DedupeStrategy,
  HttpMethod,
  HttpRequest,
  Polling,
  httpClient,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { discordAuth } from '../auth';
import { discordNewMemberTriggerOutputSchema } from '../output-schemas';

interface Member {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  joined_at: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof discordAuth>, { guildId: string | undefined; limit: number }> =
  {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue: { guildId, limit } }) => {
      if (!guildId) return [];

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://discord.com/api/v9/guilds/${guildId}/members?limit=${limit}`,
        headers: {
           Authorization: 'Bot ' + auth.secret_text,
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
  classification: 'READ',
  displayName: 'New Member',
  description: 'Fires when a member joins a server.',
  aiMetadata: {
    description: 'Fires when a new member joins the specified Discord guild (server), emitting one event per joining member with their user details. Polls the guild member list periodically, so detection is near-real-time rather than instant.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: discordNewMemberTriggerOutputSchema,
  props: {
    guildId: Property.ShortText({
      displayName: 'Server ID',
      description:
        'Right-click the server and choose Copy Server ID in Developer Mode.',
      placeholder: '123456789012345678',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Most recent members checked each poll, up to 1000.',
      required: false,
      defaultValue: 50,
      display: 'stepper',
      min: 1,
      max: 1000,
      step: 1,
      advanced: true,
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
