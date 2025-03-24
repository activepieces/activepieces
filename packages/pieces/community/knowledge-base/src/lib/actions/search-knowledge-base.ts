import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import axios, { AxiosError } from 'axios';
import { knowledgeBaseAuth } from '../..';
import { Client } from "pg";
import sqlite3 from 'sqlite3';
import dotenv from "dotenv";
dotenv.config({ path: 'packages/server/api/.env' });

const dbType = process.env["AP_DB_TYPE"];
const db = new sqlite3.Database('dev/config/database.sqlite');

interface MsProjectConfig {
  ms_project_config_id: number;
  ms_project_config_name: string;
  ms_project_config_val: string;
}

const queryDatabase = async (query: string, params: any[] = []): Promise<any[]> => {
  if (dbType === "POSTGRES") {
    const client = new Client({
      host: process.env["AP_POSTGRES_HOST"],
      user: process.env["AP_POSTGRES_USERNAME"],
      password: process.env["AP_POSTGRES_PASSWORD"],
      database: process.env["AP_POSTGRES_DATABASE"],
      port: Number(process.env["AP_POSTGRES_PORT"])
    });

    await client.connect();

    try {
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    } finally {
      await client.end();
    }
  } else {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

export const getMasterData = async () => {
  try {
    const rows = await queryDatabase('SELECT * FROM ms_project_config') as MsProjectConfig[];
    const masterData: any = {};
    rows.forEach(row => {
      if (row.ms_project_config_name === "CENTER_AUTH_LOGIN_URL") {
        masterData.CENTER_AUTH_LOGIN_URL = row.ms_project_config_val;
      }
      if (row.ms_project_config_name === "CENTER_AUTH_LOGIN_USERNAME") {
        masterData.CENTER_AUTH_LOGIN_USERNAME = row.ms_project_config_val;
      }
      if (row.ms_project_config_name === "CENTER_AUTH_LOGIN_PASSWORD") {
        masterData.CENTER_AUTH_LOGIN_PASSWORD = row.ms_project_config_val;
      }
      if (row.ms_project_config_name === "CENTER_API_USERS_ME_URL") {
        masterData.CENTER_API_USERS_ME_URL = row.ms_project_config_val;
      }
      if (row.ms_project_config_name === "KNOWLEDGE_BASE_RUN_URL") {
        masterData.KNOWLEDGE_BASE_RUN_URL = row.ms_project_config_val;
      }
      if (row.ms_project_config_name === "KNOWLEDGE_BASE_COLLECTIONS_URL") {
        masterData.KNOWLEDGE_BASE_COLLECTIONS_URL = row.ms_project_config_val;
      }
    });
    return masterData;
  } catch (error) {
    throw error;
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

const getTokenAdmin = async (CENTER_AUTH_LOGIN_URL: string, CENTER_AUTH_LOGIN_USERNAME: string, CENTER_AUTH_LOGIN_PASSWORD: string) => {
  const response = await fetch(CENTER_AUTH_LOGIN_URL, {
    method: 'POST',
    body: JSON.stringify({
      username: CENTER_AUTH_LOGIN_USERNAME,
      password: CENTER_AUTH_LOGIN_PASSWORD,
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data.token;
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
            options: response.data.map((knowledgebaseResult: any) => {
              return {
                label: knowledgebaseResult.collection_name,
                value: knowledgebaseResult.collection_name,
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
      const tokenAdmin = await getTokenAdmin(masterData.CENTER_AUTH_LOGIN_URL, masterData.CENTER_AUTH_LOGIN_USERNAME, masterData.CENTER_AUTH_LOGIN_PASSWORD);

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
            'Authorization': `Bearer ` + tokenAdmin,
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
