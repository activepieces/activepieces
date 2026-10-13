import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { pipelineOutputSchema } from '../../output-schemas-admin';

export const getPipelineAction = createAction({
  auth: gitlabAuth,
  name: 'get_pipeline',
  displayName: 'Get Pipeline',
  description: 'Gets one pipeline with its status and timings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab CI/CD pipeline by its numeric ID: status (created, pending, running, success, failed, canceled, skipped, manual), ref, SHA, who triggered it, timings and URL. Use List Pipeline Jobs for its jobs.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    pipelineId: adminProps.pipelineId(),
  },
  outputSchema: pipelineOutputSchema,
  async run({ auth, propsValue }) {
    const pipelineId = requirePositiveInt({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    return gitlabRequest({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/pipelines/${pipelineId}` });
  },
});
