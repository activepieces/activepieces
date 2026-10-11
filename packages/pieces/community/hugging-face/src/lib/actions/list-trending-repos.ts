import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfUtils } from '../common/utils';
import { listTrendingReposOutputSchema } from '../output-schemas';

export const listTrendingRepos = createAction({
  auth: huggingFaceAuth,
  name: 'list_trending_repos',
  classification: 'SEARCH',
  displayName: 'List Trending Repos',
  description: 'List the repositories currently trending on the Hugging Face Hub.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the models, datasets and Spaces currently trending on the Hugging Face Hub (up to 20), each tagged with its repo_type. Use it to answer "what is popular right now"; for keyword or tag search use Search Models, Search Datasets or Search Spaces instead. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listTrendingReposOutputSchema,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Repository Type',
      description: 'Only trending repositories of this type. Defaults to all types.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Models', value: 'model' },
          { label: 'Datasets', value: 'dataset' },
          { label: 'Spaces', value: 'space' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of trending repositories to return (1 to 20). Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { type, limit } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 20, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/trending',
      query: [
        ['type', type],
        ['limit', limit],
      ],
    });
    const body = response.body;
    const items = hfHub.isRecord(body) && Array.isArray(body['recentlyTrending']) ? body['recentlyTrending'] : [];
    const repos = items.filter(hfHub.isRecord).map((item) => {
      const repoData = hfHub.isRecord(item['repoData']) ? item['repoData'] : {};
      return { repo_type: item['repoType'] ?? null, ...repoData };
    });
    return { repos, count: repos.length };
  },
});
