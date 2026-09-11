import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { Block, KnownBlock } from '@slack/web-api';
import { slackAuth } from '../auth';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import {
  blocks,
  iconEmoji,
  mentionOriginFlow,
  getUsers,
  profilePicture,
  username,
} from '../common/props';
import { buildFlowOriginContextBlock, slackSendMessage, textToSectionBlocks } from '../common/utils';
import {
  DEFAULT_ACTION_CONCURRENCY_LIMIT,
  MAX_ACTION_CONCURRENCY_LIMIT,
  MIN_ACTION_CONCURRENCY_LIMIT,
  slackConcurrency,
} from '../common/concurrency';
import {
  BulkDmFailure,
  BulkDmMode,
  BulkDmRecipient,
  BulkDmSent,
  DEFAULT_MAX_RECIPIENTS,
  slackBulkDm,
} from '../common/bulk-dm';
import { sendMessageToMultipleUsersOutputSchema } from '../output-schemas';

export const slackSendMessageToMultipleUsersAction = createAction({
  auth: slackAuth,
  name: 'send_message_to_multiple_users',
  classification: 'WRITE',
  displayName: 'Send Message To Multiple Users',
  description: 'Send a direct message to many users at once, in parallel.',
  audience: 'human',
  outputSchema: sendMessageToMultipleUsersOutputSchema,
  aiMetadata: {
    description:
      'Sends a direct message to many Slack users in parallel and reports which sends succeeded and which failed. Replaces a loop of single Send Message To A User steps. Either one shared message for everyone, or a personal message per user. Each call posts new DMs, so it is not idempotent, and a retry re-sends to everyone.',
    idempotent: false,
  },
  props: {
    mode: Property.StaticDropdown<BulkDmMode>({
      displayName: 'Message Mode',
      description: 'Send everyone the same message, or give each user their own.',
      required: true,
      defaultValue: 'same_message',
      options: {
        disabled: false,
        options: [
          { label: 'Same message for everyone', value: 'same_message' },
          { label: 'Personal message per user', value: 'personal_message' },
        ],
      },
    }),
    recipients: Property.DynamicProperties({
      displayName: 'Recipients',
      required: true,
      refreshers: ['mode'],
      auth: slackAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const mode = propsValue['mode'];

        if (mode === 'personal_message') {
          return {
            personalMessages: Property.Array({
              displayName: 'Users And Messages',
              description: 'One entry per user. A user listed twice keeps only the last message.',
              required: true,
              properties: {
                userId: Property.ShortText({
                  displayName: 'User ID',
                  description: 'The Slack user ID to send to, for example U012AB3CD.',
                  required: true,
                }),
                text: Property.LongText({
                  displayName: 'Message',
                  required: true,
                }),
              },
            }),
          };
        }

        const auth = propsValue['auth'] as SlackAuthValue | undefined;
        const users = auth ? await getUsers(getBotToken(auth)) : [];

        return {
          userIds: Property.StaticMultiSelectDropdown({
            displayName: 'Users',
            description: 'Everyone who should receive this message.',
            required: true,
            options: {
              disabled: users.length === 0,
              placeholder: users.length === 0 ? 'Connect Slack first' : 'Select Users',
              options: users,
            },
          }),
          text: Property.LongText({
            displayName: 'Message',
            description:
              'The text of your message. Renders as a section above any Block Kit blocks, and is used as the notification fallback. Leave empty to send blocks only.',
            required: false,
          }),
        };
      },
    }),
    username,
    profilePicture,
    iconEmoji,
    mentionOriginFlow,
    blocks,
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Enable link unfurling for these messages',
      required: false,
      defaultValue: true,
    }),
    concurrency: Property.Number({
      displayName: 'Parallel Sends',
      description: `How many direct messages to send at the same time, between ${MIN_ACTION_CONCURRENCY_LIMIT} and ${MAX_ACTION_CONCURRENCY_LIMIT}. It also sets how many recipients one step accepts, because every send has to fit the flow time budget: ${slackConcurrency.roundsWithinFlowBudget()} recipients per parallel send, up to ${DEFAULT_MAX_RECIPIENTS}.`,
      required: false,
      defaultValue: DEFAULT_ACTION_CONCURRENCY_LIMIT,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const { mode, recipients, blocks: extraBlocks, unfurlLinks, mentionOriginFlow: mentionFlow } = context.propsValue;

    const rawText = recipients?.['text'];
    const sharedText = typeof rawText === 'string' ? rawText : undefined;

    const plan = slackBulkDm.buildSendPlan({
      mode,
      userIds: recipients?.['userIds'],
      text: sharedText,
      personalMessages: recipients?.['personalMessages'],
    });

    const limit = slackConcurrency.clampConcurrencyLimit(context.propsValue.concurrency);

    slackBulkDm.validateSendPlan({ recipients: plan, limit });

    const originBlock = mentionFlow ? buildFlowOriginContextBlock(context) : undefined;

    const payloads = plan.map((recipient) => {
      slackBulkDm.validateMessagePayload({ text: recipient.text, blocks: extraBlocks });

      const blockList = assembleBlocks({ text: recipient.text, extraBlocks, originBlock });
      slackBulkDm.assertBlockCountWithinLimit(blockList);

      return { recipient, blockList };
    });

    const sender = {
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      iconEmoji: context.propsValue.iconEmoji,
    };

    const outcomes = await slackConcurrency.mapWithConcurrency({
      items: payloads,
      limit,
      handler: async ({ item }) => sendOne({ ...item, token, unfurlLinks, sender }),
    });

    const sent = outcomes.filter((outcome): outcome is SentOutcome => outcome.status === 'sent');
    const failed = outcomes.filter((outcome): outcome is FailedOutcome => outcome.status === 'failed');

    if (sent.length === 0 && failed.length > 0 && failed.every((outcome) => outcome.isAuthFailure)) {
      throw new Error(
        `Slack rejected every message because of the connection, not the recipients: ${failed[0].error}. Reconnect Slack or check its scopes.`,
      );
    }

    const sentResults: BulkDmSent[] = sent.map((outcome) => outcome.result);
    const failedResults: BulkDmFailure[] = failed.map((outcome) => ({
      userId: outcome.userId,
      error: outcome.error,
    }));

    return {
      sent: sentResults,
      failed: failedResults,
      summary: slackBulkDm.summarize({ sent: sentResults, failed: failedResults }),
    };
  },
});

function assembleBlocks({
  text,
  extraBlocks,
  originBlock,
}: {
  text?: string;
  extraBlocks?: unknown;
  originBlock?: KnownBlock | Block;
}): (KnownBlock | Block)[] {
  const textBlocks = text ? textToSectionBlocks(text) : [];
  const userBlocks: (KnownBlock | Block)[] = Array.isArray(extraBlocks) ? extraBlocks : [];

  return [...textBlocks, ...userBlocks, ...(originBlock ? [originBlock] : [])];
}

async function sendOne({
  recipient,
  blockList,
  token,
  unfurlLinks,
  sender,
}: {
  recipient: BulkDmRecipient;
  blockList: (KnownBlock | Block)[];
  token: string;
  unfurlLinks?: boolean;
  sender: BulkDmSender;
}): Promise<SendOutcome> {
  try {
    const response = await slackSendMessage({
      token,
      text: recipient.text || undefined,
      username: sender.username,
      profilePicture: sender.profilePicture,
      iconEmoji: sender.iconEmoji,
      conversationId: recipient.userId,
      blocks: blockList,
      unfurlLinks,
      clientOptions: slackConcurrency.boundedClientOptions(),
    });

    const fields: Record<string, unknown> = { ...response };

    return {
      status: 'sent',
      result: {
        userId: recipient.userId,
        channel: typeof fields['channel'] === 'string' ? fields['channel'] : undefined,
        ts: typeof fields['ts'] === 'string' ? fields['ts'] : undefined,
      },
    };
  } catch (error) {
    const code = toSlackErrorCode(error);

    return {
      status: 'failed',
      userId: recipient.userId,
      error: code,
      isAuthFailure: AUTH_FAILURE_CODES.includes(code),
    };
  }
}

function toSlackErrorCode(error: unknown): string {
  if (error === null || typeof error !== 'object') {
    return 'unknown_error';
  }

  const fields: Record<string, unknown> = { ...error };
  const data = fields['data'];

  if (data !== null && typeof data === 'object') {
    const dataFields: Record<string, unknown> = { ...data };

    if (typeof dataFields['error'] === 'string') {
      return dataFields['error'];
    }
  }

  if (fields['code'] === SLACK_REQUEST_ERROR_CODE && isTimeout(fields['original'])) {
    return 'timeout';
  }

  if (typeof fields['code'] === 'string') {
    return fields['code'];
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'unknown_error';
}

function isTimeout(original: unknown): boolean {
  if (original === null || typeof original !== 'object') {
    return false;
  }

  const fields: Record<string, unknown> = { ...original };

  return typeof fields['code'] === 'string' && AXIOS_TIMEOUT_CODES.includes(fields['code']);
}

const SLACK_REQUEST_ERROR_CODE = 'slack_webapi_request_error';

const AXIOS_TIMEOUT_CODES = ['ECONNABORTED', 'ETIMEDOUT'];

const AUTH_FAILURE_CODES = [
  'invalid_auth',
  'not_authed',
  'account_inactive',
  'token_revoked',
  'token_expired',
  'missing_scope',
  'no_permission',
  'ekm_access_denied',
];

type BulkDmSender = {
  username?: string;
  profilePicture?: string;
  iconEmoji?: string;
};

type SentOutcome = {
  status: 'sent';
  result: BulkDmSent;
};

type FailedOutcome = {
  status: 'failed';
  userId: string;
  error: string;
  isAuthFailure: boolean;
};

type SendOutcome = SentOutcome | FailedOutcome;
