import { beforeEach, describe, expect, it, vi } from 'vitest';
const AppConnectionType = { CUSTOM_AUTH: 'CUSTOM_AUTH' } as const;

type ConversationsListArgs = { types?: string; exclude_archived?: boolean; limit?: number; cursor?: string };
type UsersConversationsArgs = { types?: string; exclude_archived?: boolean; limit?: number; cursor?: string };

const conversationsListCalls: ConversationsListArgs[] = [];
const usersConversationsCalls: UsersConversationsArgs[] = [];
const webClientConstructorOptions: Record<string, unknown>[] = [];

let conversationsListResponse: any = {
  channels: [
    { id: 'C111', name: 'general' },
    { id: 'C222', name: 'random' },
  ],
  response_metadata: { next_cursor: undefined },
};

let usersConversationsResponse: any = {
  channels: [
    { id: 'C333', name: 'bot-alerts' },
  ],
  response_metadata: { next_cursor: undefined },
};

let rateLimitErrorToThrow: any = null;

vi.mock('@activepieces/pieces-framework', () => ({
  MarkdownVariant: { INFO: 'info' },
  Property: {
    Dropdown: (def: any) => ({ ...def, type: 'DROPDOWN' }),
    MarkDown: (def: any) => ({ ...def, type: 'MARKDOWN' }),
    ShortText: (def: any) => ({ ...def, type: 'SHORT_TEXT' }),
    LongText: (def: any) => ({ ...def, type: 'LONG_TEXT' }),
    Checkbox: (def: any) => ({ ...def, type: 'CHECKBOX' }),
    Json: (def: any) => ({ ...def, type: 'JSON' }),
    Array: (def: any) => ({ ...def, type: 'ARRAY' }),
    StaticDropdown: (def: any) => ({ ...def, type: 'STATIC_DROPDOWN' }),
    MultiSelectDropdown: (def: any) => ({ ...def, type: 'MULTI_SELECT_DROPDOWN' }),
  },
  AppConnectionType: {
    CUSTOM_AUTH: 'CUSTOM_AUTH',
    SECRET_TEXT: 'SECRET_TEXT',
    OAUTH2: 'OAUTH2',
  },
}));

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    constructor(token: string, options?: Record<string, unknown>) {
      if (options) {
        webClientConstructorOptions.push(options);
      }
    }
    conversations = {
      list: async (args: ConversationsListArgs) => {
        conversationsListCalls.push(args);
        if (rateLimitErrorToThrow) {
          throw rateLimitErrorToThrow;
        }
        return conversationsListResponse;
      },
    };
    users = {
      conversations: async (args: UsersConversationsArgs) => {
        usersConversationsCalls.push(args);
        if (rateLimitErrorToThrow) {
          throw rateLimitErrorToThrow;
        }
        return usersConversationsResponse;
      },
    };
  },
}));

vi.mock('../src/lib/common/auth-helpers', () => ({
  getBotToken: () => 'xoxb-mock-token',
}));

vi.mock('../src/lib/auth', () => ({
  slackAuth: {},
}));

vi.mock('@activepieces/pieces-common', () => ({}));

const { getChannels, slackChannel, isSlackRateLimitError, extractRetryAfterSeconds } = await import(
  '../src/lib/common/props'
);

const mockAuth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { botToken: 'xoxb-mock-token' },
};

beforeEach(() => {
  conversationsListCalls.length = 0;
  usersConversationsCalls.length = 0;
  webClientConstructorOptions.length = 0;
  rateLimitErrorToThrow = null;
  conversationsListResponse = {
    channels: [
      { id: 'C111', name: 'general' },
      { id: 'C222', name: 'random' },
    ],
    response_metadata: { next_cursor: undefined },
  };
  usersConversationsResponse = {
    channels: [
      { id: 'C333', name: 'bot-alerts' },
    ],
    response_metadata: { next_cursor: undefined },
  };
});

describe('getChannels and slackChannel with botOnly & rate limit fail-fast', () => {
  it('instantiates WebClient with rejectRateLimitedCalls: true', async () => {
    await getChannels('xoxb-mock-token');
    expect(webClientConstructorOptions.length).toBeGreaterThan(0);
    expect(webClientConstructorOptions[0]).toEqual({ rejectRateLimitedCalls: true });
  });

  it('lists public and private channels by default (botOnly: false)', async () => {
    const channels = await getChannels('xoxb-mock-token', false);
    expect(conversationsListCalls.length).toBe(1);
    expect(conversationsListCalls[0]).toEqual({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000,
      cursor: undefined,
    });
    expect(usersConversationsCalls.length).toBe(0);
    expect(channels).toEqual([
      { label: 'general', value: 'C111' },
      { label: 'random', value: 'C222' },
    ]);
  });

  it('lists only channels the bot belongs to when botOnly: true via users.conversations', async () => {
    const channels = await getChannels('xoxb-mock-token', true);
    expect(usersConversationsCalls.length).toBe(1);
    expect(usersConversationsCalls[0]).toEqual({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 1000,
      cursor: undefined,
    });
    expect(conversationsListCalls.length).toBe(0);
    expect(channels).toEqual([
      { label: 'bot-alerts', value: 'C333' },
    ]);
  });

  it('slackChannel dropdown uses conversations.list by default', async () => {
    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(conversationsListCalls.length).toBe(1);
    expect(usersConversationsCalls.length).toBe(0);
    expect(result).toEqual({
      disabled: false,
      placeholder: 'Select channel',
      options: [
        { label: 'general', value: 'C111' },
        { label: 'random', value: 'C222' },
      ],
    });
  });

  it('slackChannel dropdown respects per-action choice botOnly: true via options object', async () => {
    const channelProp = slackChannel(true, { botOnly: true });
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(usersConversationsCalls.length).toBe(1);
    expect(conversationsListCalls.length).toBe(0);
    expect(result.options).toEqual([
      { label: 'bot-alerts', value: 'C333' },
    ]);
  });

  it('slackChannel dropdown respects per-action choice botOnly: true via boolean', async () => {
    const channelProp = slackChannel(true, true);
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(usersConversationsCalls.length).toBe(1);
    expect(conversationsListCalls.length).toBe(0);
    expect(result.options).toEqual([
      { label: 'bot-alerts', value: 'C333' },
    ]);
  });

  it('slackChannel dropdown respects dynamic toggle prop botOnly: true', async () => {
    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth, botOnly: true });

    expect(usersConversationsCalls.length).toBe(1);
    expect(conversationsListCalls.length).toBe(0);
    expect(result.options).toEqual([
      { label: 'bot-alerts', value: 'C333' },
    ]);
  });

  it('slackChannel dropdown respects dynamic toggle prop botOnlyChannels: true', async () => {
    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth, botOnlyChannels: true });

    expect(usersConversationsCalls.length).toBe(1);
    expect(conversationsListCalls.length).toBe(0);
    expect(result.options).toEqual([
      { label: 'bot-alerts', value: 'C333' },
    ]);
  });

  it('fails fast on 429 rate limit and returns disabled dropdown naming Retry-After', async () => {
    rateLimitErrorToThrow = {
      status: 429,
      statusCode: 429,
      code: 'slack_webapi_rate_limited_error',
      retryAfter: 35,
    };

    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(result).toEqual({
      disabled: true,
      placeholder: 'Rate limited by Slack (retry after 35s)',
      options: [],
    });
  });

  it('fails fast on 429 rate limit with Retry-After header string', async () => {
    rateLimitErrorToThrow = {
      status: 429,
      headers: {
        'retry-after': '42',
      },
    };

    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(result).toEqual({
      disabled: true,
      placeholder: 'Rate limited by Slack (retry after 42s)',
      options: [],
    });
  });

  it('fails fast on 429 rate limit without Retry-After and returns graceful placeholder', async () => {
    rateLimitErrorToThrow = {
      status: 429,
      code: 'slack_webapi_rate_limited_error',
      message: 'ratelimit error',
    };

    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: mockAuth });

    expect(result).toEqual({
      disabled: true,
      placeholder: 'Rate limited by Slack (please retry later)',
      options: [],
    });
  });

  it('re-throws non-rate-limit errors as unexpected failures', async () => {
    rateLimitErrorToThrow = new Error('invalid_auth');

    const channelProp = slackChannel(true);
    await expect((channelProp as any).options({ auth: mockAuth })).rejects.toThrow('invalid_auth');
  });

  it('handles empty auth gracefully', async () => {
    const channelProp = slackChannel(true);
    const result = await (channelProp as any).options({ auth: undefined });

    expect(result).toEqual({
      disabled: true,
      placeholder: 'connect slack account',
      options: [],
    });
  });
});
