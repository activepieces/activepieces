import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  pagingInput,
  requirePositiveInt,
} from '../../common/props';
import { discussionListOutputSchema } from '../../output-schemas';

export const listMergeRequestDiscussionsAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_request_discussions',
  displayName: 'List Merge Request Discussions',
  description: 'Lists the discussion threads of a merge request.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists discussion threads on a GitLab merge request, each with its notes and, for diff comments, the file position and resolved state. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    mergeRequestIid: gitlabProps.mergeRequestIid(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: discussionListOutputSchema,
  async run({ auth, propsValue }) {
    const iid = requirePositiveInt({
      value: propsValue.mergeRequestIid,
      label: 'Merge Request IID',
    });
    return gitlabListPage({
      auth,
      path: `${projectPath(
        propsValue.projectId
      )}/merge_requests/${iid}/discussions`,
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
