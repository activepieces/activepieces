export type StreakPipeline = {
  pipelineKey?: string;
  key: string;
  name: string;
  description?: string;
  creatorKey?: string;
  creationTimestamp?: number;
  lastUpdatedTimestamp?: number;
};

export type StreakStage = {
  key: string;
  name: string;
};

export type StreakBox = {
  boxKey?: string;
  key: string;
  name: string;
  pipelineKey: string;
  stageKey?: string;
  creatorKey?: string;
  creationTimestamp?: number;
  lastUpdatedTimestamp?: number;
  notes?: string;
  followerKeys?: string[];
  followerCount?: number;
  commentCount?: number;
  taskTotal?: number;
  gmailThreadCount?: number;
  fileCount?: number;
  fields?: Record<string, unknown>;
};

export type StreakTeam = {
  key: string;
  name: string;
  creator?: string;
  creationDate?: number;
};

export type StreakTeamsResponse = {
  results: StreakTeam[];
};

export type StreakSearchResponse = {
  results: {
    boxes?: Array<{
      boxKey: string;
      name: string;
      stageKey?: string;
      pipelineKey?: string;
      lastUpdatedTimestamp?: number;
    }>;
    orgs?: Array<{
      key: string;
      name?: string;
      domains?: string[];
      industry?: string;
    }>;
    contacts?: Array<{
      key: string;
      emailAddresses?: string[];
      title?: string;
    }>;
  };
  page?: number;
  query?: string;
};

export type StreakWebhook = {
  key: string;
  event: string;
  targetUrl: string;
  pipelineKey?: string;
  teamKey?: string;
  userKey?: string;
  creationDate?: number;
  lastSavedTimestamp?: number;
};

export type StreakUser = {
  key: string;
  userKey?: string;
  email?: string;
  lowercaseEmail?: string;
  displayName?: string;
  creationTimestamp?: number;
  lastUpdatedTimestamp?: number;
  lastSeenTimestamp?: number;
  isOauthComplete?: boolean;
};
