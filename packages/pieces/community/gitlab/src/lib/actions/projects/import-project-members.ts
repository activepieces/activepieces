import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { GitlabApiError, isRecord } from '../../common/secret-request';
import { importMembersOutputSchema } from '../../output-schemas-admin';

type ImportResult = { status?: string; message?: unknown };

function toImportResult(value: unknown): ImportResult | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return { status: typeof value['status'] === 'string' ? value['status'] : undefined, message: value['message'] };
}

function perUserErrors(message: unknown): Array<{ user: string; message: string }> {
  if (message === undefined || message === null) {
    return [];
  }
  if (isRecord(message)) {
    return Object.entries(message).map(([user, text]) => ({
      user,
      message: typeof text === 'string' ? text : JSON.stringify(text),
    }));
  }
  return [{ user: '', message: typeof message === 'string' ? message : JSON.stringify(message) }];
}

export const importProjectMembersAction = createAction({
  auth: gitlabAuth,
  name: 'import_project_members',
  displayName: 'Import Project Members',
  description: 'Copies the members of another project into this project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Copies the direct members of a source GitLab project into a target project with their roles; the source must be given as a numeric project ID. Members who cannot be added are listed in errors with the reason, and status is error when any failed. Running it again with the same members succeeded unchanged in testing. Requires Maintainer role on the target.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId('Numeric ID or full path of the project that receives the members.'),
    sourceProjectId: Property.Number({ displayName: 'Source Project ID', description: 'Numeric ID of the project to copy the members from (a path is rejected by GitLab). Get Project returns it.', required: true }),
  },
  outputSchema: importMembersOutputSchema,
  async run({ auth, propsValue }) {
    const sourceProjectId = requirePositiveInt({ value: propsValue.sourceProjectId, label: 'Source Project ID' });
    let result: ImportResult | undefined;
    try {
      result = await gitlabRequest<ImportResult | undefined>({ auth, 
        method: 'POST',
        path: `${projectPath(propsValue.projectId)}/import_project_members/${sourceProjectId}`,
      });
    } catch (error) {
      const body = error instanceof GitlabApiError ? toImportResult(error.responseBody) : undefined;
      if (error instanceof GitlabApiError && error.status === 422 && body?.status === 'error') {
        result = body;
      } else {
        throw error;
      }
    }
    const errors = result?.status === 'error' ? perUserErrors(result.message) : [];
    return { status: result?.status ?? 'success', sourceProjectId, errors };
  },
});
