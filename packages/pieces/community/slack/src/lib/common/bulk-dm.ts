import { Block, KnownBlock } from '@slack/web-api';
import { slackConcurrency } from './concurrency';

function buildSendPlan({ mode, userIds, text, personalMessages }: BuildSendPlanParams): BulkDmRecipient[] {
  const entries =
    toMode(mode) === 'same_message'
      ? toSameMessageEntries({ userIds, text })
      : toPersonalMessageEntries(personalMessages);

  return dedupeByUserId(entries);
}

function maxRecipientsForLimit({ limit }: { limit: number }): number {
  return Math.min(DEFAULT_MAX_RECIPIENTS, slackConcurrency.roundsWithinFlowBudget() * limit);
}

function validateSendPlan({ recipients, limit }: { recipients: BulkDmRecipient[]; limit: number }): void {
  if (recipients.length === 0) {
    throw new Error('Select at least one user to send a message to.');
  }

  const maxRecipients = maxRecipientsForLimit({ limit });

  if (recipients.length > maxRecipients) {
    throw new Error(
      maxRecipients < DEFAULT_MAX_RECIPIENTS
        ? `At Parallel Sends ${limit} this action sends to at most ${maxRecipients} users at a time, but ${recipients.length} were provided. Raise Parallel Sends or split the list across multiple steps.`
        : `This action sends to at most ${maxRecipients} users at a time, but ${recipients.length} were provided. Split the list across multiple steps.`,
    );
  }

  const malformed = recipients.filter((recipient) => !SLACK_USER_ID_PATTERN.test(recipient.userId));

  if (malformed.length > 0) {
    throw new Error(
      `Not a valid Slack user ID: ${malformed.map((recipient) => recipient.userId).join(', ')}. Expected IDs starting with U or W.`,
    );
  }
}

function validateMessagePayload({ text, blocks }: { text?: string; blocks?: unknown }): void {
  const hasText = typeof text === 'string' && text.trim().length > 0;
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  if (!hasText && !hasBlocks) {
    throw new Error('Either Message or Block Kit blocks must be provided');
  }
}

function assertBlockCountWithinLimit(blocks: (KnownBlock | Block)[]): void {
  if (blocks.length > SLACK_MAX_BLOCKS_PER_MESSAGE) {
    throw new Error(
      `Slack accepts at most ${SLACK_MAX_BLOCKS_PER_MESSAGE} blocks per message, but this message builds ${blocks.length}. Shorten the message or send fewer blocks.`,
    );
  }
}

function summarize({ sent, failed }: { sent: BulkDmSent[]; failed: BulkDmFailure[] }): BulkDmSummary {
  return {
    total: sent.length + failed.length,
    sentCount: sent.length,
    failedCount: failed.length,
  };
}

function toMode(value: unknown): BulkDmMode {
  if (value === 'same_message' || value === 'personal_message') {
    return value;
  }

  throw new Error(`Unknown mode "${String(value)}".`);
}

function toSameMessageEntries({ userIds, text }: { userIds?: unknown; text?: string }): BulkDmRecipient[] {
  if (!Array.isArray(userIds)) {
    throw new Error('Select at least one user to send a message to.');
  }

  return userIds.map((userId) => {
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('Every selected user must be a Slack user ID.');
    }
    return { userId: userId.trim(), text };
  });
}

function toPersonalMessageEntries(personalMessages?: unknown): BulkDmRecipient[] {
  if (!Array.isArray(personalMessages)) {
    throw new Error('Add at least one user and message pair.');
  }

  return personalMessages.map((entry, index) => {
    if (entry === null || typeof entry !== 'object') {
      throw new Error(`Entry ${index + 1} is missing a user and a message.`);
    }

    const candidate: Record<string, unknown> = { ...entry };
    const entryUserId = candidate['userId'];
    const entryText = candidate['text'];

    if (typeof entryUserId !== 'string' || entryUserId.trim().length === 0) {
      throw new Error(`Entry ${index + 1} is missing a user.`);
    }

    if (typeof entryText !== 'string' || entryText.trim().length === 0) {
      throw new Error(`Entry ${index + 1} is missing a message.`);
    }

    return { userId: entryUserId.trim(), text: entryText };
  });
}

function dedupeByUserId(entries: BulkDmRecipient[]): BulkDmRecipient[] {
  const byUserId = new Map<string, BulkDmRecipient>();

  for (const entry of entries) {
    byUserId.set(entry.userId, entry);
  }

  return [...byUserId.values()];
}

export const slackBulkDm = {
  buildSendPlan,
  maxRecipientsForLimit,
  validateSendPlan,
  validateMessagePayload,
  assertBlockCountWithinLimit,
  summarize,
};

export const SLACK_MAX_BLOCKS_PER_MESSAGE = 50;
export const DEFAULT_MAX_RECIPIENTS = 80;

const SLACK_USER_ID_PATTERN = /^[UW][A-Z0-9]{2,}$/;

export type BulkDmMode = 'same_message' | 'personal_message';

export type BulkDmRecipient = {
  userId: string;
  text?: string;
};

export type BulkDmSent = {
  userId: string;
  channel?: string;
  ts?: string;
};

export type BulkDmFailure = {
  userId: string;
  error: string;
};

export type BulkDmSummary = {
  total: number;
  sentCount: number;
  failedCount: number;
};

type BuildSendPlanParams = {
  mode: unknown;
  userIds?: unknown;
  text?: string;
  personalMessages?: unknown;
};
