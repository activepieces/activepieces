import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoProject } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const updateProject = createAction({
  auth: togglTrackAuth,
  name: 'update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Update the settings of a project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates a project by ID; omitted fields keep their value, and Active = No archives it. Hourly rate is Classic only. Returns the updated project. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    project_id: togglCommon.project_id,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    client_id: togglCommon.client_id,
    is_private: togglCommon.updateFlag({
      displayName: 'Private',
      description: 'Whether the project is private.',
    }),
    billable: togglCommon.updateFlag({
      displayName: 'Billable',
      description: 'Whether the project is billable. (Premium feature)',
    }),
    active: togglCommon.updateFlag({
      displayName: 'Active',
      description: 'No archives the project, Yes restores it.',
    }),
    color: Property.ShortText({
      displayName: 'Project Color',
      description:
        'Hex color like #ff0000. Leave empty to keep the current color.',
      required: false,
    }),
    estimated_hours: Property.Number({
      displayName: 'Estimated Hours',
      description: 'Leave empty to keep the current estimate. (Premium feature)',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Hourly Rate',
      description:
        'Leave empty to keep it. Premium, Toggl Track (Classic) only.',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date of the project timeframe (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'End date of the project timeframe (YYYY-MM-DD).',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.project,
  async run(context) {
    const { name, color, estimated_hours, rate, start_date, end_date } =
      context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const projectId = togglApi.requireId({
      value: context.propsValue.project_id,
      label: 'Project',
    });
    const clientId = togglApi.optionalId({
      value: context.propsValue.client_id,
      label: 'Client',
    });
    const isPrivate = togglCommon.flagValue(context.propsValue.is_private);
    const billable = togglCommon.flagValue(context.propsValue.billable);
    const active = togglCommon.flagValue(context.propsValue.active);
    for (const [label, value] of [
      ['Start Date', start_date],
      ['End Date', end_date],
    ]) {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`${label} must use the YYYY-MM-DD format.`);
      }
    }

    return togglApi.withNotFound({
      label: `Project ${projectId}`,
      run: async () => {
        if (togglApi.isTwo(auth)) {
          if (!isNil(rate)) {
            throw togglApi.classicOnlyError('Updating the project hourly rate');
          }
          const projectPath = togglApi.twoWorkspacePath({
            auth,
            workspaceId,
            path: `/projects/${projectId}`,
          });
          const body = {
            ...(name ? { name } : {}),
            ...(isNil(clientId) ? {} : { client_id: clientId }),
            ...(isNil(isPrivate) ? {} : { private: isPrivate }),
            ...(isNil(billable) ? {} : { billable }),
            ...(color ? { color } : {}),
            ...(isNil(estimated_hours)
              ? {}
              : { estimated_mins: Math.round(estimated_hours * 60) }),
            ...(start_date ? { start_date } : {}),
            ...(end_date ? { end_date } : {}),
          };
          if (Object.keys(body).length === 0 && isNil(active)) {
            throw new Error('Provide at least one field to update.');
          }
          if (Object.keys(body).length > 0) {
            await togglApi.request<unknown>({
              auth,
              method: togglApi.HttpMethod.PATCH,
              path: projectPath,
              body,
            });
          }
          if (!isNil(active)) {
            await togglApi.request<unknown>({
              auth,
              method: togglApi.HttpMethod.PATCH,
              path: `${projectPath}/${active ? 'unarchive' : 'archive'}`,
            });
          }
          const updated = await togglApi.request<TwoProject>({
            auth,
            method: togglApi.HttpMethod.GET,
            path: projectPath,
          });
          return togglModels.project(updated);
        }

        const body = {
          ...(name ? { name } : {}),
          ...(isNil(clientId) ? {} : { client_id: clientId }),
          ...(isNil(isPrivate) ? {} : { is_private: isPrivate }),
          ...(isNil(billable) ? {} : { billable }),
          ...(isNil(active) ? {} : { active }),
          ...(color ? { color } : {}),
          ...(isNil(estimated_hours) ? {} : { estimated_hours }),
          ...(isNil(rate) ? {} : { rate }),
          ...(start_date ? { start_date } : {}),
          ...(end_date ? { end_date } : {}),
        };
        if (Object.keys(body).length === 0) {
          throw new Error('Provide at least one field to update.');
        }
        return togglApi.request<Record<string, unknown>>({
          auth,
          method: togglApi.HttpMethod.PUT,
          path: `/workspaces/${workspaceId}/projects/${projectId}`,
          body,
        });
      },
    });
  },
});
