import { Store } from '@activepieces/pieces-framework';

export type PromptXAuthType = {
  server: 'production' | 'staging';
  username: string;
  password: string;
};

export type AccessTokenResponse = {
  access_token?: string;
  error?: string;
  message?: string;
};

type UrlConfig = {
  loginUrl: string;
  quotaCheckUrl: string;
  addTokenUrl: string;
  myProfileUrl: string;
  getAIKeyUrl: string;
};

type UsagePackage = {
  package_name: string;
  total_tokens_used: number;
  limit_token_usage: number;
  token_available: number;
  total_credit_used: number;
  limit_credit_usage: number;
  credit_available: number;
};

type UserInfo = {
  userIAM2ID: string;
  email: string;
  username: string;
};

interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface AppUsageData {
  appId?: string;
  userId: string;
  model: string;
  projectId: string;
  flowId: string;
  agentId?: string;
  component: string;
  usage: Usage;
}

export const baseUrlMap: Record<string, UrlConfig> = {
  production: {
    loginUrl: 'https://centerapp.io/center/auth/login',
    quotaCheckUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/quota-check',
    addTokenUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/token-used',
    myProfileUrl: 'https://centerapp.io/center//api/v1/users/me',
    getAIKeyUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/api-key?key=openAIKey',
  },
  staging: {
    loginUrl: 'https://test.oneweb.tech/zero-service/pmtx/login',
    quotaCheckUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/quota-check',
    addTokenUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/token-used',
    myProfileUrl: 'https://mocha.centerapp.io/center//api/v1/users/me',
    getAIKeyUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/api-key?key=openAIKey',
  },
};

export const getAccessToken = async ({
  server,
  username,
  password,
}: PromptXAuthType) => {
  const response = await fetch(baseUrlMap[server].loginUrl, {
    method: 'POST',
    body: new URLSearchParams({
      username: username,
      password: password,
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data: AccessTokenResponse = await response.json();

  if (response.status !== 200) {
    throw new Error(data?.error || data?.message);
  }

  if (!data.access_token) {
    throw new Error(data?.error || data?.message);
  }

  return data.access_token;
};

export const addTokenUsage = async (
  data: AppUsageData,
  server: 'production' | 'staging',
  access_token: string
) => {
  try {
    const response = await fetch(baseUrlMap[server]['addTokenUrl'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(data),
    });
    if (response.status !== 200) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send token usage:', error);
    throw error;
  }
};

export const getUsagePlan = async (
  server: 'production' | 'staging',
  access_token: string
) => {
  const response = await fetch(baseUrlMap[server]['quotaCheckUrl'], {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status !== 201) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result: UsagePackage = await response.json();
  return result;
};

export const getUserProfile = async (
  server: 'production' | 'staging',
  access_token: string
) => {
  const response = await fetch(baseUrlMap[server]['myProfileUrl'], {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status !== 200) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result: UserInfo = await response.json();
  return result;
};

export const getStoreData = async (
  store: Store,
  server: 'production' | 'staging',
  access_token: string
) => {
  // Get store data
  let userId = await store.get('userId');
  const apiKey = await getAiApiKey(server, access_token);

  if (!userId) {
    const userInfo = await getUserProfile(server, access_token);
    store.put('userId', userInfo.userIAM2ID);
    userId = userInfo.userIAM2ID;
  }
  return {
    userId,
    apiKey,
  };
};

export const getAiApiKey = async (
  server: 'production' | 'staging',
  access_token: string
) => {
  const response = await fetch(baseUrlMap[server]['getAIKeyUrl'], {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status !== 201) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result: { openAIKey?: string } = await response.json();
  if (!result.openAIKey) {
    throw new Error('No AI Api Key found for Avalant OpenAI');
  }
  return result.openAIKey;
};
