import { Store } from '@activepieces/pieces-framework';

export const baseUrl = 'https://api.anthropic.com/v1';

export const billingIssueMessage = `Error Occurred: 429 \n

1. Ensure that you have enough tokens on your Anthropic platform. \n
2. Top-up the credit in promptX's Billing page. \n
3. Attempt the process again`;

export const unauthorizedMessage = `Error Occurred: 401 \n

Ensure that your API key is valid. \n
`;
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
export const Production = 'PromptX';
export const Test = 'Staging';

export const baseUrlMap: Record<string, UrlConfig> = {
  [Production]: {
    loginUrl: 'https://centerapp.io/center/auth/login',
    quotaCheckUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/quota-check',
    addTokenUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/token-used',
    myProfileUrl: 'https://centerapp.io/center//api/v1/users/me',
    getAIKeyUrl:
      'https://promptxai.com/zero-service/pmtx-ai-token-api/v1/api-key?key=claudeKey',
  },
  [Test]: {
    loginUrl: 'https://test.oneweb.tech/zero-service/pmtx/login',
    quotaCheckUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/quota-check',
    addTokenUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/token-used',
    myProfileUrl: 'https://mocha.centerapp.io/center//api/v1/users/me',
    getAIKeyUrl:
      'https://test.oneweb.tech/zero-service/pmtx-ai-token-api/v1/api-key?key=claudeKey',
  },
};
export const getAccessToken = async (
  server: string,
  username: string,
  password: string
): Promise<string | null> => {
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
  const data = await response.json();
  if (response.status !== 200) {
    throw new Error(data?.error || data?.message);
  }

  return data?.access_token;
};

export const addTokenUsage = async (
  data: AppUsageData,
  server: string,
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

export const getUsagePlan = async (server: string, access_token: string) => {
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

export const getUserProfile = async (server: string, access_token: string) => {
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
  server: string,
  access_token: string
) => {
  //get store data
  let userId: any = await store.get('userId');
  let apiKey = await getAiApiKey(server, access_token);

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

export const getAiApiKey = async (server: string, access_token: string) => {
  const response = await fetch(baseUrlMap[server]['getAIKeyUrl'], {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access_token}`,
    },
  });
  if (response.status !== 201) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result = await response.json();
  if (!result?.claudeKey) {
    throw new Error('No AI Api Key found for Avalant Claude');
  }
  return result?.claudeKey;
};
