import {
  AdaptlyPostAccount,
  AdaptlyPostCreateResponse,
  AdaptlyPostPost,
  AdaptlyPostValidationReport,
  AdaptlyPostWebhookAccount,
} from './types';

function joined(values: (string | undefined | null)[]): string | null {
  const kept = values.filter(
    (value): value is string => typeof value === 'string' && value !== ''
  );
  return kept.length > 0 ? kept.join(', ') : null;
}

function post(value: AdaptlyPostPost) {
  const platforms = value.platforms ?? [];
  return {
    post_id: value.id,
    status: value.status,
    content_type: value.contentType,
    text: value.text ?? null,
    scheduled_at: value.scheduledAt ?? null,
    timezone: value.timezone ?? null,
    created_at: value.createdAt,
    updated_at: value.updatedAt,
    platforms: joined(platforms.map((entry) => entry.platform)),
    published_platforms: joined(
      platforms
        .filter((entry) => entry.status === 'PUBLISHED')
        .map((entry) => entry.platform)
    ),
    failed_platforms: joined(
      platforms
        .filter((entry) => entry.status === 'FAILED')
        .map((entry) => entry.platform)
    ),
    post_urls: joined(platforms.map((entry) => entry.postUrl)),
    errors: joined(
      platforms.map((entry) =>
        entry.errorMessage
          ? `${entry.platform}: ${entry.errorMessage}`
          : undefined
      )
    ),
    media_urls: joined(value.mediaUrls ?? []),
    labels: joined((value.labels ?? []).map((label) => label.name)),
    label_ids: joined((value.labels ?? []).map((label) => label.id)),
    recurring_post_id: value.recurringPostId ?? null,
  };
}

function createResult(value: AdaptlyPostCreateResponse) {
  return {
    post_id: value.postId,
    is_scheduled: value.isScheduled,
    scheduled_at: value.scheduledAt ?? null,
    queued_platforms: joined(value.queuedPlatforms ?? []),
    skipped_platforms: joined(
      (value.skippedPlatforms ?? []).map((skipped) =>
        [skipped.platform, skipped.reason].filter(Boolean).join(': ')
      )
    ),
    recurring_post_id: value.recurringPostId ?? null,
  };
}

function validation(value: AdaptlyPostValidationReport) {
  const accountIssues = value.accounts.flatMap((account) =>
    account.issues.map(
      (issue) =>
        `${account.platform}${
          account.accountName ? ` (${account.accountName})` : ''
        }: ${issue.message}`
    )
  );
  return {
    valid: value.valid,
    outcome: value.outcome,
    scheduled_at: value.scheduledAt ?? null,
    ready_accounts: joined(
      value.accounts
        .filter((account) => account.status === 'READY')
        .map((account) => account.platform)
    ),
    warning_accounts: joined(
      value.accounts
        .filter((account) => account.status === 'WARNING')
        .map((account) => account.platform)
    ),
    blocked_accounts: joined(
      value.accounts
        .filter((account) => account.status === 'BLOCKED')
        .map((account) => account.platform)
    ),
    issues: joined([
      ...value.issues.map((issue) => issue.message),
      ...accountIssues,
    ]),
    not_checked: joined(value.notChecked.map((item) => item.message)),
  };
}

function account(value: AdaptlyPostAccount) {
  return {
    account_id: value.id,
    platform: value.platform,
    display_name: value.displayName,
    username: value.username || null,
    status: value.status,
    unauthorized_reason: value.unauthorizedReason ?? null,
    facebook_page_id: value.pageId ?? null,
    avatar_url: value.avatarUrl || null,
  };
}

function webhookAccount(value: AdaptlyPostWebhookAccount) {
  return {
    account_id: value.id ?? null,
    platform: value.platform ?? null,
    display_name: value.displayName ?? null,
    facebook_page_id: value.pageId ?? null,
    reason: value.reason ?? null,
  };
}

export const adaptlyPostOutput = {
  post,
  createResult,
  validation,
  account,
  webhookAccount,
};
