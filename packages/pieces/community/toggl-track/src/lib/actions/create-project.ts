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

export const createProject = createAction({
  auth: togglTrackAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a new project in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a project in a workspace. Needs the workspace and a name; client, privacy, billable, color, estimate, fee, and dates are optional (hourly rate and external reference are Classic only). Returns the new project. A retry creates a duplicate.',
    idempotent: false,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project.',
      required: true,
    }),
    client_id: togglCommon.client_id,
    is_private: Property.Checkbox({
      displayName: 'Private',
      description: 'Whether the project is private or not.',
      required: false,
      defaultValue: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the project is billable. (Premium feature)',
      required: false,
      defaultValue: false,
    }),
    template: Property.Checkbox({
      displayName: 'Is Template',
      description: 'Whether the project is a template. (Premium feature)',
      required: false,
      defaultValue: false,
    }),
    external_reference: Property.ShortText({
      displayName: 'External Reference',
      description:
        'External system reference. Toggl Track (Classic) only.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Project Color',
      description: 'Project color in hex format (e.g. #ff0000).',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the project is active. Toggl Track (Classic) only.',
      required: false,
      defaultValue: true,
    }),
    auto_estimates: Property.Checkbox({
      displayName: 'Auto Estimates',
      description:
        'Whether estimates are based on task hours. (Premium feature)',
      required: false,
      defaultValue: false,
    }),
    estimated_hours: Property.Number({
      displayName: 'Estimated Hours',
      description: 'Estimated hours for the project. (Premium feature)',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Hourly Rate',
      description:
        'Hourly rate. Premium feature, Toggl Track (Classic) only.',
      required: false,
    }),
    fixed_fee: Property.Number({
      displayName: 'Fixed Fee',
      description:
        'Project fixed fee, in the workspace currency. (Premium feature)',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date of project timeframe (YYYY-MM-DD).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'End date of project timeframe (YYYY-MM-DD).',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.project,
  async run(context) {
    const {
      name,
      is_private,
      billable,
      template,
      external_reference,
      color,
      active,
      auto_estimates,
      estimated_hours,
      rate,
      fixed_fee,
      start_date,
      end_date,
    } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const clientId = togglApi.optionalId({
      value: context.propsValue.client_id,
      label: 'Client',
    });

    if (togglApi.isTwo(auth)) {
      const currency = isNil(fixed_fee)
        ? undefined
        : (
            await togglApi.request<{ currency: string }>({
              auth,
              method: togglApi.HttpMethod.GET,
              path: `/workspaces/${workspaceId}/currency`,
            })
          ).currency;
      const created = await togglApi.request<TwoProject>({
        auth,
        method: togglApi.HttpMethod.POST,
        path: togglApi.twoWorkspacePath({
          auth,
          workspaceId,
          path: '/projects',
        }),
        body: {
          name,
          private: is_private,
          billable,
          is_template: template,
          auto_compute_estimates: auto_estimates,
          ...(isNil(clientId) ? {} : { client_id: clientId }),
          ...(color ? { color } : {}),
          ...(isNil(estimated_hours)
            ? {}
            : { estimated_mins: Math.round(estimated_hours * 60) }),
          ...(isNil(fixed_fee) || isNil(currency)
            ? {}
            : { fixed_fee: { amount: fixed_fee, currency } }),
          ...(start_date ? { start_date } : {}),
          ...(end_date ? { end_date } : {}),
        },
      });
      return togglModels.project(created);
    }

    return togglApi.request<Record<string, unknown>>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/workspaces/${workspaceId}/projects`,
      body: {
        name,
        is_private,
        billable,
        template,
        active,
        auto_estimates,
        ...(isNil(clientId) ? {} : { client_id: clientId }),
        ...(external_reference ? { external_reference } : {}),
        ...(color ? { color } : {}),
        ...(isNil(estimated_hours) ? {} : { estimated_hours }),
        ...(isNil(rate) ? {} : { rate }),
        ...(isNil(fixed_fee) ? {} : { fixed_fee }),
        ...(start_date ? { start_date } : {}),
        ...(end_date ? { end_date } : {}),
      },
    });
  },
});
