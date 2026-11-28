export const POST_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PENDING',
  'PUBLISHING',
  'COMPLETED',
  'PARTIAL_FAILURE',
  'FAILED',
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export type AdaptlyPostPlatformEntry = {
  platform: string;
  status: string;
  accountName?: string;
  postUrl?: string;
  errorMessage?: string;
  publishedAt?: string;
};

export type AdaptlyPostLabel = {
  id: string;
  name: string;
  color: string;
};

export type AdaptlyPostPost = {
  id: string;
  status: PostStatus;
  contentType: string;
  text?: string;
  scheduledAt?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  platforms: AdaptlyPostPlatformEntry[];
  labels: AdaptlyPostLabel[];
  recurringPostId?: string;
};

export type AdaptlyPostAccount = {
  id: string;
  platform: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  status: string;
  unauthorizedReason?: string;
  pageId?: string;
};

export type AdaptlyPostCreateResponse = {
  postId: string;
  queuedPlatforms: string[];
  skippedPlatforms?: { platform?: string; reason?: string }[];
  isScheduled: boolean;
  scheduledAt?: string;
  recurringPostId?: string;
};

export type AdaptlyPostIssue = {
  code: string;
  severity?: string;
  message: string;
};

export type AdaptlyPostValidationReport = {
  valid: boolean;
  outcome: string;
  scheduledAt?: string;
  issues: AdaptlyPostIssue[];
  accounts: {
    platform: string;
    accountName?: string;
    status: string;
    issues: AdaptlyPostIssue[];
  }[];
  notChecked: { code: string; message: string }[];
};

export type AdaptlyPostWebhookAccount = {
  id?: string;
  platform?: string;
  displayName?: string;
  pageId?: string;
  reason?: string;
};

export type AdaptlyPostWebhookPayload = {
  id: string;
  event: string;
  createdAt: string;
  data: {
    post?: AdaptlyPostPost;
    account?: AdaptlyPostWebhookAccount;
  };
};
