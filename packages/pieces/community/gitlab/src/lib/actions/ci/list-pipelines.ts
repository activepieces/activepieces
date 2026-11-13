import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, optionalIsoDate, optionalText, pagingInput } from '../../common/props';
import { pipelineListOutputSchema } from '../../output-schemas-admin';

export const PIPELINE_STATUSES = ['created', 'waiting_for_resource', 'preparing', 'pending', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual', 'scheduled'];

export const listPipelinesAction = createAction({
  auth: gitlabAuth,
  name: 'list_pipelines',
  displayName: 'List Pipelines',
  description: 'Lists the CI/CD pipelines of a project, newest first, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists GitLab CI/CD pipelines of a project with optional filters (status, branch or tag, commit SHA, source, triggering username, updated after/before). Returns one page plus nextPage/hasMore. Use to find a pipeline ID for Get Pipeline, Retry Pipeline or Cancel Pipeline.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: PIPELINE_STATUSES.map((value) => ({ label: value, value })) },
    }),
    ref: Property.ShortText({ displayName: 'Branch or Tag', required: false }),
    sha: Property.ShortText({ displayName: 'Commit SHA', required: false }),
    source: Property.ShortText({ displayName: 'Source', description: 'e.g. push, web, api, schedule, merge_request_event.', required: false }),
    username: Property.ShortText({ displayName: 'Triggered By Username', required: false }),
    updatedAfter: Property.ShortText({ displayName: 'Updated After', description: 'ISO 8601 date-time.', required: false }),
    updatedBefore: Property.ShortText({ displayName: 'Updated Before', description: 'ISO 8601 date-time.', required: false }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: { options: [{ label: 'ID', value: 'id' }, { label: 'Status', value: 'status' }, { label: 'Ref', value: 'ref' }, { label: 'Updated At', value: 'updated_at' }, { label: 'User ID', value: 'user_id' }] },
    }),
    sort: gitlabProps.sort(),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: pipelineListOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/pipelines`,
      query: {
        status: propsValue.status,
        ref: optionalText(propsValue.ref),
        sha: optionalText(propsValue.sha),
        source: optionalText(propsValue.source),
        username: optionalText(propsValue.username)?.replace(/^@/, ''),
        updated_after: optionalIsoDate({ value: propsValue.updatedAfter, label: 'Updated After' }),
        updated_before: optionalIsoDate({ value: propsValue.updatedBefore, label: 'Updated Before' }),
        order_by: propsValue.orderBy,
        sort: propsValue.sort,
      },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
