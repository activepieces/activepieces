import {
  DedupeStrategy,
  HttpMethod,
  Polling,
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
import { discordCommon } from '../common';
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

const MEMBERS_PAGE_SIZE = 1000;

const polling: Polling<AppConnectionValueForAuthProperty<typeof discordAuth>, { guildId: string | undefined }> =
  {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue: { guildId } }) => {
      if (!guildId) return [];

      const scanStartedAt = Date.now();
      const members = await listAllMembers({ auth, guildId });
      return members
        .map((item) => ({
          epochMilliSeconds: dayjs(item.joined_at).valueOf(),
          data: item,
        }))
        .filter((item) => item.epochMilliSeconds <= scanStartedAt);
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
  },
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, { ...context, propsValue: { guildId: context.propsValue.guildId } });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, { ...context, propsValue: { guildId: context.propsValue.guildId } });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, { ...context, propsValue: { guildId: context.propsValue.guildId } });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, { ...context, propsValue: { guildId: context.propsValue.guildId } });
  },
});

async function listAllMembers({
  auth,
  guildId,
  after,
}: {
  auth: AppConnectionValueForAuthProperty<typeof discordAuth>;
  guildId: string;
  after?: string;
}): Promise<Member[]> {
  const res = await discordCommon.sendWithRateLimitRetry<Member[]>({
    request: {
      method: HttpMethod.GET,
      url: `https://discord.com/api/v9/guilds/${guildId}/members`,
      queryParams: {
        limit: String(MEMBERS_PAGE_SIZE),
        ...(after ? { after } : {}),
      },
      headers: {
         Authorization: 'Bot ' + auth.secret_text,
      },
    },
  });
  if (res.body.length < MEMBERS_PAGE_SIZE) {
    return res.body;
  }
  const rest = await listAllMembers({ auth, guildId, after: res.body[res.body.length - 1].user.id });
  return [...res.body, ...rest];
}
