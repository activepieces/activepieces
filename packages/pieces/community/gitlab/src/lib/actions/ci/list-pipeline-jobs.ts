import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabListPage, projectPath } from '../../common/client';
import { gitlabProps, pagingInput, requirePositiveInt, stringList, triStateValue } from '../../common/props';
import { jobListOutputSchema } from '../../output-schemas-admin';

export const JOB_SCOPES = ['created', 'pending', 'running', 'failed', 'success', 'canceled', 'skipped', 'waiting_for_resource', 'manual'];

export const listPipelineJobsAction = createAction({
  auth: gitlabAuth,
  name: 'list_pipeline_jobs',
  displayName: 'List Pipeline Jobs',
  description: 'Lists the jobs of a pipeline, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the jobs of one GitLab pipeline with their stage and status, optionally filtered by status. Returns one page plus nextPage/hasMore. Use to find a job ID for Get Job Log, Play Manual Job, Cancel Job or Erase Job.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    pipelineId: adminProps.pipelineId(),
    scope: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      description: 'Only jobs in these statuses. Leave empty for all.',
      required: false,
      options: { options: JOB_SCOPES.map((value) => ({ label: value, value })) },
    }),
    includeRetried: gitlabProps.triState('Include Retried Jobs', 'Leave empty to hide earlier attempts of retried jobs.'),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: jobListOutputSchema,
  async run({ auth, propsValue }) {
    const pipelineId = requirePositiveInt({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    const scope = stringList({ value: propsValue.scope, label: 'Statuses' });
    const unknown = scope?.filter((value) => !JOB_SCOPES.includes(value)) ?? [];
    if (unknown.length > 0) {
      throw new Error(`Unknown job status: ${unknown.join(', ')}. Use one of ${JOB_SCOPES.join(', ')}.`);
    }
    return gitlabListPage({ auth, 
      path: `${projectPath(propsValue.projectId)}/pipelines/${pipelineId}/jobs`,
      query: { scope, include_retried: triStateValue(propsValue.includeRetried) },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
