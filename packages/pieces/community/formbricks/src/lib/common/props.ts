import { Property } from '@activepieces/pieces-framework';
import { formBricksAuth } from './auth';
import { formbricksApi } from './api';

export const formbricksProps = {
  workspace: ({ required, description }: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: formBricksAuth,
      displayName: 'Workspace',
      description: description ?? 'The Formbricks workspace (project) to use.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Formbricks account first' };
        }
        try {
          const workspaces = await formbricksApi.listWorkspaces({ auth });
          if (workspaces.length === 0) {
            return { disabled: true, options: [], placeholder: 'This API key has no workspace access' };
          }
          return {
            disabled: false,
            options: workspaces.map((workspace) => ({ label: workspace.name, value: workspace.id })),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: dropdownError({ error, what: 'workspaces' }) };
        }
      },
    }),
  survey: ({ required, description }: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: formBricksAuth,
      displayName: 'Survey',
      description: description ?? 'Pick the survey.',
      required,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Formbricks account first' };
        }
        try {
          const surveys = await formbricksApi.listAllSurveys({ auth, workspaceId: asOptionalString(workspaceId) });
          if (surveys.length === 0) {
            return { disabled: true, options: [], placeholder: 'No surveys found' };
          }
          return {
            disabled: false,
            options: surveys.map((survey) => ({ label: surveyLabel(survey), value: survey.id })),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: dropdownError({ error, what: 'surveys' }) };
        }
      },
    }),
  surveys: ({ description }: { description: string }) =>
    Property.MultiSelectDropdown({
      auth: formBricksAuth,
      displayName: 'Surveys',
      description,
      required: false,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your Formbricks account first' };
        }
        try {
          const surveys = await formbricksApi.listAllSurveys({ auth, workspaceId: asOptionalString(workspaceId) });
          return {
            disabled: false,
            options: surveys.map((survey) => ({ label: surveyLabel(survey), value: survey.id })),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: dropdownError({ error, what: 'surveys' }) };
        }
      },
    }),
  responseData: ({ required, description }: { required: boolean; description: string }) =>
    Property.Object({
      displayName: 'Answers',
      description,
      required,
    }),
};

function surveyLabel(survey: { name: string; status: string }): string {
  return survey.status ? `${survey.name} (${survey.status})` : survey.name;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function dropdownError({ error, what }: { error: unknown; what: string }): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Couldn't load ${what}: ${message}`.slice(0, 300);
}
