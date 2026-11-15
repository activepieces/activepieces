import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoProject } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findProject = createAction({
  auth: togglTrackAuth,
  name: 'find_project',
  classification: 'SEARCH',
  displayName: 'Find Project',
  description: 'Find a project in a workspace by its name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists projects in a workspace, optionally filtered by name, status, billable, ownership, or template flag. On Toggl 2.0 "inactive" means archived. Returns an array of projects. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project to find.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Project Status',
      description: 'Return active, inactive, or both types of projects.',
      required: false,
      defaultValue: 'true',
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
    billable: Property.Checkbox({
      displayName: 'Billable Only',
      description: 'Return only billable projects.',
      required: false,
    }),
    only_me: Property.Checkbox({
      displayName: 'My Projects Only',
      description: 'Get only projects assigned to the current user.',
      required: false,
      defaultValue: false,
    }),
    only_templates: Property.Checkbox({
      displayName: 'Templates Only',
      description: 'Return only template projects.',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page (max 200; Toggl 2.0: max 100).',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.projectList,
  async run(context) {
    const { name, active, billable, only_me, only_templates, page, per_page } =
      context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const queryParams: QueryParams = {};
      if (name) queryParams['name'] = name;
      if (active === 'true') queryParams['archived'] = 'false';
      if (active === 'false') queryParams['archived'] = 'true';
      if (only_me) queryParams['only_me'] = 'true';
      const projects = await togglApi.listTwoPageOrAll<TwoProject>({
        auth,
        path: togglApi.twoWorkspacePath({
          auth,
          workspaceId,
          path: '/projects',
        }),
        queryParams,
        page: page ?? undefined,
        perPage: per_page ?? undefined,
      });
      return projects
        .filter((project) => (billable ? project.billable : true))
        .filter((project) => (only_templates ? project.is_template : true))
        .map(togglModels.project);
    }

    const queryParams: QueryParams = {};
    if (name) queryParams['name'] = name;
    if (active !== undefined && active !== null) queryParams['active'] = active;
    if (billable !== undefined) queryParams['billable'] = billable.toString();
    if (only_me !== undefined) queryParams['only_me'] = only_me.toString();
    if (only_templates !== undefined)
      queryParams['only_templates'] = only_templates.toString();
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();

    const projects = await togglApi.request<Record<string, unknown>[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: `/workspaces/${workspaceId}/projects`,
      queryParams,
    });
    return projects ?? [];
  },
});
