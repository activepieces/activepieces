export type TallyForm = {
  id: string;
  name: string;
  status: string;
  isNameModifiedByUser?: boolean;
  workspaceId?: string;
  folderId?: string | null;
  organizationId?: string;
  hasDraftBlocks?: boolean;
  numberOfSubmissions?: number;
  isClosed?: boolean;
  index?: number;
  payments?: { amount: number; currency: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type TallyFormDetail = TallyForm & {
  settings?: unknown;
  blocks?: unknown[];
};

export type TallyFormsResponse = {
  items: TallyForm[];
  hasMore: boolean;
  page: number;
  limit?: number;
  total?: number;
};

export type TallyWebhookResponse = { id: string };

export type TallyQuestionOption = { id: string; text: string };

export type TallyQuestionField = { uuid: string; title: string; questionType: string };

export type TallyQuestion = {
  id: string;
  type: string;
  title: string;
  fields?: TallyQuestionField[];
};

export type TallySubmissionResponse = {
  id: string;
  formId: string;
  respondentId: string;
  isCompleted: boolean;
  submittedAt: string;
  responses: {
    questionId: string;
    answer: unknown;
  }[];
};

export type TallySubmissionsApiResponse = {
  questions: TallyQuestion[];
  submissions: TallySubmissionResponse[];
};

export type TallyField = {
  key: string;
  label: string;
  type: string;
  value: unknown;
  options?: TallyQuestionOption[];
  rows?: TallyQuestionOption[];
  columns?: TallyQuestionOption[];
};

export type TallyQuestionListItem = {
  id: string;
  type: string;
  title: string;
  isTitleModifiedByUser: boolean;
  formId: string;
  isDeleted: boolean;
  numberOfResponses: number;
  createdAt: string;
  updatedAt: string;
  fields: { uuid: string; type: string; questionType?: string; blockGroupUuid: string; title: string }[];
};

export type TallyListFormQuestionsResponse = {
  questions: TallyQuestionListItem[];
  hasResponses: boolean;
};

export type TallySubmissionResponseItem = {
  id: string;
  formId: string;
  questionId: string;
  respondentId: string;
  submissionId: string | null;
  sessionUuid: string;
  answer: unknown;
  formattedAnswer?: string;
  createdAt: string;
  updatedAt: string;
};

export type TallySubmissionListItem = {
  id: string;
  formId: string;
  isCompleted: boolean;
  submittedAt: string;
  previewUrl: string;
  pdfUrl: string;
  responses: TallySubmissionResponseItem[];
};

export type TallyListSubmissionsResponse = {
  page: number;
  limit: number;
  hasMore: boolean;
  totalNumberOfSubmissionsPerFilter: { all: number; completed: number; partial: number };
  questions: TallyQuestionListItem[];
  submissions: TallySubmissionListItem[];
};

export type TallyGetSubmissionResponse = {
  questions: TallyQuestionListItem[];
  submission: TallySubmissionListItem;
};

export type TallyFormMetrics = {
  visits: number;
  visitDuration: number;
  submissions: number;
  uniqueRespondents: number;
  totalViews: number;
  starts: number;
  completions: number;
  completionDuration: number;
  completionRate: number;
};

export type TallyFormVisitAnalytics = {
  data: Record<string, { totalVisits: number }>;
  interval: number;
};

export type TallyFormSubmissionAnalytics = {
  data: Record<string, { completed: number; partial: number }>;
  interval: number;
};

export type TallyFormDimensionsAnalytics = {
  source: Record<string, number>;
  browser: Record<string, number>;
  os: Record<string, number>;
  device: Record<string, number>;
  country: Record<string, number>;
  city: Record<string, number>;
};

export type TallyFormDropOffAnalytics = {
  stats: {
    totalVisitors: number;
    formStarts: number;
    formCompletes: number;
    completionRate: number;
    completionTimeInSeconds: number;
    visitDurationInSeconds: number;
  };
  dataAvailableSince: string;
  data: {
    blockGroupUuid: string;
    views: number;
    startedViews: number;
    answers: number;
    drops: number;
    title: string;
    type: string;
    answerRate: number;
    dropRate: number;
    isRequired: boolean;
  }[];
  hasConditionalLogic: boolean;
};

export type TallyUserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  organizationId: string;
  isBlocked: boolean;
  isDeleted: boolean;
  timezone: string;
  hasTwoFactorEnabled: boolean;
  emailDomain: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TallyCurrentUser = TallyUserSummary & {
  isOrganizationOwner: boolean;
  organizationOwner: TallyUserSummary;
  canAccessBilling: boolean;
  subscriptionPlan: 'FREE' | 'PRO' | 'BUSINESS';
  hasPendingSubscriptionCancellation: boolean;
  hasAccess: boolean;
  excessUsage: unknown;
};

export type TallyWorkspaceInvite = { id: string; email: string; workspaceIds: string[] };

export type TallyFolder = {
  id: string;
  name: string;
  workspaceId: string;
  parentId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type TallyWorkspace = {
  id: string;
  name: string | null;
  index: number;
  members: TallyUserSummary[];
  invites: TallyWorkspaceInvite[];
  folders?: TallyFolder[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type TallyListWorkspacesResponse = {
  items: TallyWorkspace[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type TallyWebhookPayload = {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
  };
};
