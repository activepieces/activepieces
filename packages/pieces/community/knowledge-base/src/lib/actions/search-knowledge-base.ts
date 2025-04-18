import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import axios, { AxiosError } from 'axios';
import { knowledgeBaseAuth } from '../..';

export const getMasterData = async () => {
  try {
    const isProduction = process.env["IS_PRODUCTION"] === "true";
    const masterData: any = {};
    if (isProduction) {
      masterData.CENTER_AUTH_LOGIN_URL = process.env["CENTER_AUTH_LOGIN_URL"];
      masterData.CENTER_API_USERS_ME_URL = process.env["CENTER_API_USERS_ME_URL"];
      masterData.KNOWLEDGE_BASE_RUN_URL = process.env["KNOWLEDGE_BASE_RUN_URL"];
      masterData.KNOWLEDGE_BASE_COLLECTIONS_URL = process.env["KNOWLEDGE_BASE_COLLECTIONS_URL"];
    } else {
      masterData.CENTER_AUTH_LOGIN_URL = "https://mocha.centerapp.io/center/auth/login";
      masterData.CENTER_API_USERS_ME_URL = "https://mocha.centerapp.io/center/api/v1/users/me";
      masterData.KNOWLEDGE_BASE_RUN_URL = "https://mlsandbox.oneweb.tech/px/retrieval";
      masterData.KNOWLEDGE_BASE_COLLECTIONS_URL = "https://test.oneweb.tech/KnowledgeBaseFileService/collections";
    }
    return masterData;
  } catch (error) {
    const masterData: any = {};
    masterData.CENTER_AUTH_LOGIN_URL = "https://mocha.centerapp.io/center/auth/login";
    masterData.CENTER_API_USERS_ME_URL = "https://mocha.centerapp.io/center/api/v1/users/me";
    masterData.KNOWLEDGE_BASE_RUN_URL = "https://mlsandbox.oneweb.tech/px/retrieval";
    masterData.KNOWLEDGE_BASE_COLLECTIONS_URL = "https://test.oneweb.tech/KnowledgeBaseFileService/collections";
    return masterData;
  }
};

const getAccessToken = async (CENTER_AUTH_LOGIN_URL: string, auth: any): Promise<string | null> => {
  const response = await fetch(CENTER_AUTH_LOGIN_URL, {
    method: 'POST',
    body: JSON.stringify({
      username: auth.username,
      password: auth.password,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data.token;
};

const getUserMe = async (CENTER_API_USERS_ME_URL: string, accessToken: string) => {
  const response = await fetch(CENTER_API_USERS_ME_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ` + accessToken,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data.iam2ID;
}

export const searchKnowledgeBase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'searchKnowledgeBase',
  displayName: 'Search Knowledge Base',
  description: "Search for any information in Avalant's knowledge base",
  auth: knowledgeBaseAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The query to search for in the knowledge base',
      required: true,
    }),
    knowledgeBaseId: Property.Dropdown({
      displayName: 'Knowledge Base ID',
      description: 'The knowledge base ID to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your connection first',
            options: [],
          };
        }
        try {
          const masterData = await getMasterData();
          const accessToken = await getAccessToken(masterData.CENTER_AUTH_LOGIN_URL, auth) || '';
          const userId = await getUserMe(masterData.CENTER_API_USERS_ME_URL, accessToken);

          const response = await axios.get(
            masterData.KNOWLEDGE_BASE_COLLECTIONS_URL + `/` + userId,
            {
              headers: {
                'Authorization': `Bearer ` + accessToken,
                'Content-Type': 'application/json',
              },
            }
          );

          return {
            disabled: false,
            options: response.data.data.map((knowledgebaseResult: any) => {
              return {
                label: knowledgebaseResult.collection_name,
                value: knowledgebaseResult.collection_id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load list collection, Connection is invalid",
          };
        }
      },
    }),
    topK: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of top results to return (1-10)',
      required: true,
      defaultValue: 3,
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      description: 'Minimum similarity score threshold (0.0 to 1.0)',
      required: false,
      defaultValue: 0.5,
    }),
  },
  async run(context) {
    const { query, knowledgeBaseId, topK, scoreThreshold } = context.propsValue;

    try {
      const auth = context.auth;
      const masterData = await getMasterData();
      const accessToken = await getAccessToken(masterData.CENTER_AUTH_LOGIN_URL, auth) || '';
      const userId = await getUserMe(masterData.CENTER_API_USERS_ME_URL, accessToken);

      const response = await axios.post(
        masterData.KNOWLEDGE_BASE_RUN_URL,
        {
          query: query,
          knowledge_id: knowledgeBaseId,
          retrieval_setting: {
            top_k: topK,
            score_threshold: scoreThreshold,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ` + accessToken,
            'userId': userId,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError: any = error as AxiosError;
        throw new Error(
          `Knowledgebase API Error: ${axiosError.response?.data?.message ||
          axiosError.message ||
          'Unknown error occurred'
          }` + query
        );
      }
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
