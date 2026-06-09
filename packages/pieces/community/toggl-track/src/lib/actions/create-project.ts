import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

export const createProject = createAction({
  auth: togglTrackAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project in a workspace.',
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
        'External reference to link this project with external systems.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Project Color',
      description: 'Project color in hex format (e.g. #ff0000).',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      description: 'Whether the project is active.',
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
      description: 'Hourly rate for the project. (Premium feature)',
      required: false,
    }),
    fixed_fee: Property.Number({
      displayName: 'Fixed Fee',
      description: 'Project fixed fee. (Premium feature)',
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
  async run(context) {
    const {
      workspace_id,
      name,
      client_id,
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
    const apiToken = context.auth;

    const body = {
      name,
      is_private,
      billable,
      template,
      active,
      auto_estimates,
      ...(client_id && { client_id }),
      ...(external_reference && { external_reference }),
      ...(color && { color }),
      ...(estimated_hours && { estimated_hours }),
      ...(rate && { rate }),
      ...(fixed_fee && { fixed_fee }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.track.toggl.com/api/v9/workspaces/${workspace_id}/projects`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString(
          'base64'
        )}`,
      },
      body,
    });

    return response.body;
  },
});
