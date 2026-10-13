import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import { GitlabDiff } from '../../common/models';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { diffListOutputSchema } from '../../output-schemas';

export function capDiff(
  diff: GitlabDiff
): GitlabDiff & { diffTruncated: boolean } {
  const text = typeof diff.diff === 'string' ? diff.diff : '';
  if (text.length <= MAX_DIFF_CHARS) {
    return { ...diff, diffTruncated: false };
  }
  return { ...diff, diff: text.slice(0, MAX_DIFF_CHARS), diffTruncated: true };
}

export const listMergeRequestDiffsAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_request_diffs',
  displayName: 'List Merge Request Diffs',
  description: 'Lists the changed files of a merge request with their diffs.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the files changed in a GitLab merge request with old/new paths, new/renamed/deleted flags and the unified diff text. Each diff is cut at 20,000 characters (diffTruncated tells you); read the full file with Get File. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: diffListOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    const result = await gitlabListPage<GitlabDiff>({
      auth,
      path: `${projectPath(propsValue.projectId)}/merge_requests/${iid}/diffs`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
    return { ...result, items: result.items.map(capDiff) };
  },
});

export const MAX_DIFF_CHARS = 20_000;
