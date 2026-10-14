import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { listRepoCommitsOutputSchema } from '../output-schemas';

export const listRepoCommits = createAction({
  auth: huggingFaceAuth,
  name: 'list_repo_commits',
  classification: 'SEARCH',
  displayName: 'List Repo Commits',
  description: 'List the commit history of a branch or revision in a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the commit history of a Hub repository revision, newest first, one page per call (page-number pagination with next_page); each commit carries its id, title, message, authors and date. Use commit ids as revisions for Compare Revisions or Read Repo File; use List Branches & Tags to find branch names. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listRepoCommitsOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    revision: hfProps.revision(),
    page: hfProps.page(),
    limit: hfProps.limit({ defaultValue: 50, max: 1000 }),
  },
  async run(context) {
    const { repo_type, repo_id, revision, page, limit } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 1000, name: 'Limit' });
    hfUtils.assertLimit({ value: page, min: 0, max: Number.MAX_SAFE_INTEGER, name: 'Page' });
    const token = context.auth.secret_text;
    const pageNumber = page ?? 0;
    const pageSize = limit ?? 50;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/commits/${hfRepo.encodeRevision(revision)}`,
      query: [
        ['p', pageNumber],
        ['limit', pageSize],
      ],
    });
    const commits = Array.isArray(response.body) ? response.body : [];
    const linkedPage = hfHub.parseNextLinkParam({ headers: response.headers, param: 'p' });
    const nextPage = linkedPage !== null ? Number(linkedPage) : commits.length >= pageSize ? pageNumber + 1 : null;
    return {
      commits,
      count: commits.length,
      page: pageNumber,
      next_page: nextPage,
    };
  },
});
