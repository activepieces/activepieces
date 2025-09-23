import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';
import { fetchUrls, getAccessToken, getUserMe } from '../helper';
import { promptxAuth } from '../auth';
import { PromptXAuth } from '../types';

export const searchKnowledgeBase = createAction({
  name: 'searchKnowledgeBase',
  displayName: 'Search Knowledge Base',
  description: 'Search for any information in PromptX knowledge base',
  auth: promptxAuth,
  props: {
    knowledgeBaseId: Property.Dropdown({
      displayName: 'Knowledge Base ID',
      description: 'The knowledge base ID to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const promptxAuth = auth as PromptXAuth;
        try {
          const urls = fetchUrls(
            promptxAuth.server ?? 'production',
            promptxAuth.customAuthUrl,
            promptxAuth.customAppUrl
          );
          const accessToken = await getAccessToken(
            urls.CENTER_AUTH_LOGIN_URL,
            promptxAuth.username,
            promptxAuth.password
          );
          const userMe = await getUserMe(
            urls.CENTER_API_USERS_ME_URL,
            accessToken
          );

          const response = await axios.get(
            `${urls.KNOWLEDGE_BASE_COLLECTIONS_URL}/${userMe.iam2ID}`,
            {
              headers: {
                Authorization: `Bearer ` + accessToken,
                'Content-Type': 'application/json',
              },
            }
          );

          return {
            disabled: false,
            options: response.data.data.map(
              (knowledgeBaseResult: {
                collection_name: string;
                collection_id: string;
              }) => {
                return {
                  label: knowledgeBaseResult.collection_name,
                  value: knowledgeBaseResult.collection_id,
                };
              }
            ),
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
    fetchOption: Property.StaticDropdown<string>({
      displayName: 'Fetch Option',
      description: 'Choose retrieval granularity',
      required: true,
      defaultValue: 'filecontents',
      options: {
        disabled: false,
        options: [
          { label: 'File Contents', value: 'filecontents' },
          { label: 'Section', value: 'section' },
          { label: 'Chunk', value: 'chunk' },
        ],
      },
    }),
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The query to search for in the knowledge base',
      required: true,
    }),
    filterTags: Property.Array({
      displayName: 'Filter Tags',
      description: 'Optional list of tags to filter by',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          required: true,
        }),
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
  async run({ auth, propsValue }) {
    const {
      query,
      knowledgeBaseId,
      fetchOption,
      filterTags,
      topK,
      scoreThreshold,
    } = propsValue;

    try {
      const {
        server = 'production',
        username,
        password,
        customAuthUrl,
        customAppUrl,
      } = auth;
      const urls = fetchUrls(server, customAuthUrl, customAppUrl);
      const accessToken = await getAccessToken(server, username, password);
      const userMe = await getUserMe(urls.CENTER_API_USERS_ME_URL, accessToken);

      const tagArray = Array.isArray(filterTags)
        ? filterTags
            .map((t: any) =>
              t && typeof t.tag === 'string' ? t.tag.trim() : ''
            )
            .filter((t: string) => t.length > 0)
        : [];

      const payload = {
        knowledge_id: knowledgeBaseId,
        fetch_option: fetchOption,
        query: query,
        filter_tags: tagArray,
        retrieval_setting: {
          top_k: topK,
          score_threshold: scoreThreshold ?? 0,
        },
      };

      const response = await axios.post(urls.KNOWLEDGE_BASE_RUN_URL, payload, {
        headers: {
          Authorization: `Bearer ` + accessToken,
          userId: userMe.iam2ID,
          'Content-Type': 'application/json',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `KnowledgeBase API Error: ${
            error.response?.data?.message ||
            error.message ||
            'Unknown error occurred'
          }` + query
        );
      } else {
        throw new Error(
          `Unexpected error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  },
});
