import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText } from '../../common/props';
import { isRecord } from '../../common/secret-request';
import { pipelineOutputSchema } from '../../output-schemas-admin';

export function pipelineVariables(value: unknown): Array<{ key: string; value: string; variable_type: string }> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error('Variables must be an object of name to value.');
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return undefined;
  }
  return entries.map(([key, raw]) => {
    const name = key.trim();
    if (!/^[A-Za-z0-9_]+$/.test(name)) {
      throw new Error(`Variable name "${key}" may only contain letters, digits and underscores.`);
    }
    if (raw !== null && typeof raw === 'object') {
      throw new Error(`Variable "${name}" must be a text value.`);
    }
    return { key: name, value: raw === undefined || raw === null ? '' : String(raw), variable_type: 'env_var' };
  });
}

export const createPipelineAction = createAction({
  auth: gitlabAuth,
  name: 'create_pipeline',
  displayName: 'Run Pipeline',
  description: 'Starts a new CI/CD pipeline for a branch or tag.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts a new GitLab CI/CD pipeline on a branch or tag, optionally with pipeline variables. Every call starts another pipeline. Returns the pipeline ID; follow it with Get Pipeline or List Pipeline Jobs. The project needs a .gitlab-ci.yml on that ref. Variables are refused (400 Insufficient permissions) unless the project CI/CD setting allows the connected user role to set pipeline variables; new gitlab.com projects allow no one by default.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    ref: Property.ShortText({ displayName: 'Branch or Tag', description: 'Branch or tag to run the pipeline on.', required: true }),
    variables: Property.Object({ displayName: 'Variables', description: 'Pipeline variables as name to value, e.g. DEPLOY_ENV = staging.', required: false }),
  },
  outputSchema: pipelineOutputSchema,
  async run({ auth, propsValue }) {
    const ref = requireText({ value: propsValue.ref, label: 'Branch or Tag' });
    const variables = pipelineVariables(propsValue.variables);
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/pipeline`,
      body: { ref, variables },
      statusMessages: { 400: 'GitLab could not create the pipeline (check the ref exists, has a valid .gitlab-ci.yml, and that the project allows your role to set pipeline variables)' },
    });
  },
});
