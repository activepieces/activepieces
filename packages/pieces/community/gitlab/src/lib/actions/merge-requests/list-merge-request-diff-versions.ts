import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { diffVersionListOutputSchema } from '../../output-schemas';

export const listMergeRequestDiffVersionsAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_request_diff_versions',
  displayName: 'List Merge Request Diff Versions',
  description: 'Lists the diff versions (pushes) of a merge request.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the diff versions of a GitLab merge request (one per push), with head, base and start SHAs. Returns one page plus nextPage/hasMore. Use List Merge Request Diffs for the file changes themselves.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: diffVersionListOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabListPage({
      auth,
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/versions`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
