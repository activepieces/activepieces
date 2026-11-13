import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import {
  gitlabProps,
  optionalIsoDate,
  optionalPositiveInt,
  optionalText,
  pagingInput,
  stringList,
} from '../../common/props';
import { mergeRequestListOutputSchema } from '../../output-schemas';

export const listMergeRequestsAction = createAction({
  auth: gitlabAuth,
  name: 'list_merge_requests',
  displayName: 'List Merge Requests',
  description:
    'Lists or searches merge requests in one project, or across projects when no project is given.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists GitLab merge requests in one project, or across every project the user can see when Project is empty. Without a project, Scope decides whose merge requests are returned and GitLab defaults to only those created by the connected user, so set Scope to All to see everyone's. Scope All without a project returns public merge requests from all of gitlab.com and can time out, so give a project for that. Returns one page plus nextPage/hasMore.",
    idempotent: true,
  },
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID or Path',
      description: 'Optional. Leave empty to search across projects.',
      required: false,
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description:
        'Whose merge requests to return. Without a project GitLab defaults to Created by Me; in a project it defaults to All.',
      required: false,
      options: {
        options: [
          { label: 'Created by Me', value: 'created_by_me' },
          { label: 'Assigned to Me', value: 'assigned_to_me' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Opened', value: 'opened' },
          { label: 'Closed', value: 'closed' },
          { label: 'Locked', value: 'locked' },
          { label: 'Merged', value: 'merged' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches title and description.',
      required: false,
    }),
    labels: Property.Array({ displayName: 'Labels', required: false }),
    sourceBranch: Property.ShortText({
      displayName: 'Source Branch',
      required: false,
    }),
    targetBranch: Property.ShortText({
      displayName: 'Target Branch',
      required: false,
    }),
    authorId: Property.Number({
      displayName: 'Author User ID',
      required: false,
    }),
    reviewerId: Property.Number({
      displayName: 'Reviewer User ID',
      required: false,
    }),
    updatedAfter: Property.ShortText({
      displayName: 'Updated After',
      description: 'ISO 8601 date-time.',
      required: false,
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: mergeRequestListOutputSchema,
  async run({ auth, propsValue }) {
    const project = optionalText(propsValue.projectId);
    return gitlabListPage({
      auth,
      path:
        project === undefined
          ? '/merge_requests'
          : `${projectPath(project)}/merge_requests`,
      query: {
        scope: propsValue.scope,
        state: propsValue.state,
        search: optionalText(propsValue.search),
        labels: stringList({ value: propsValue.labels, label: 'Labels' })?.join(
          ','
        ),
        source_branch: optionalText(propsValue.sourceBranch),
        target_branch: optionalText(propsValue.targetBranch),
        author_id: optionalPositiveInt({
          value: propsValue.authorId,
          label: 'Author User ID',
        }),
        reviewer_id: optionalPositiveInt({
          value: propsValue.reviewerId,
          label: 'Reviewer User ID',
        }),
        updated_after: optionalIsoDate({
          value: propsValue.updatedAfter,
          label: 'Updated After',
        }),
        sort: propsValue.sort,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
      statusMessages: {
        408: 'GitLab timed out listing merge requests across all projects. Set Project, or use Scope Created by Me or Assigned to Me',
      },
    });
  },
});
