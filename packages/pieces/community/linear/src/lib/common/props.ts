import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { LinearDocument } from '@linear/sdk';

export const props = {
  team_id: (required = true) =>
    Property.Dropdown({
      description:
        'The team for which the issue, project or comment will be created',
      displayName: 'Team',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const teams = await client.listTeams({
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
            first: 100,
            after: cursor,
          });

          for (const team of teams.nodes) {
            options.push({ label: team.name, value: team.id });
          }

          hasNextPage = teams.pageInfo.hasNextPage;
          cursor = teams.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
  status_id: (required = false) =>
    Property.Dropdown({
      description: 'Status of the Issue',
      displayName: 'Status',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth || !team_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select team',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const filter: LinearDocument.WorkflowStatesQueryVariables = {
            filter: {
              team: {
                id: {
                  eq: team_id as string,
                },
              },
            },
            first: 100,
            after: cursor,
          };
          const statusList = await client.listIssueStates(filter);

          for (const status of statusList.nodes) {
            options.push({ label: status.name, value: status.id });
          }

          hasNextPage = statusList.pageInfo.hasNextPage;
          cursor = statusList.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
  labels: (required = false) =>
    Property.MultiSelectDropdown({
      description: 'Labels for the Issue',
      displayName: 'Labels',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'select a team to load labels',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const labels = await client.listIssueLabels({
            filter: {
              team: {
                id: {
                  eq: team_id as string,
                },
              },
            },
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
            first: 100,
            after: cursor,
          });

          for (const label of labels.nodes) {
            options.push({ label: label.name, value: label.id });
          }

          hasNextPage = labels.pageInfo.hasNextPage;
          cursor = labels.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
  assignee_id: (required = false) =>
    Property.Dropdown({
      description: 'Assignee of the Issue / Comment',
      displayName: 'Assignee',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const users = await client.listUsers({
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
            first: 100,
            after: cursor,
          });

          for (const user of users.nodes) {
            options.push({ label: user.name, value: user.id });
          }

          hasNextPage = users.pageInfo.hasNextPage;
          cursor = users.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
  priority_id: (required = false) =>
    Property.Dropdown({
      description: 'Priority of the Issue',
      displayName: 'Priority',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const priorities = await client.listIssuePriorities();

        return {
          disabled: false,
          options: priorities.map((priority: { label: any; priority: any }) => {
            return {
              label: priority.label,
              value: priority.priority,
            };
          }),
        };
      },
    }),
  issue_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Issue',
      required,
      description: 'ID of Linear Issue',
      refreshers: ['team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth || !team_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select team',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const filter: LinearDocument.IssuesQueryVariables = {
          first: 50,
          filter: {
            team: {
              id: {
                eq: team_id as string,
              },
            },
          },
          orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
        };
        const issues = await client.listIssues(filter);
        return {
          disabled: false,
          options: issues.nodes.map((issue: { title: any; id: any }) => {
            return {
              label: issue.title,
              value: issue.id,
            };
          }),
        };
      },
    }),

  project_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Project',
      required,
      description: 'ID of Linear Project',
      refreshers: ['team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth || !team_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select team',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const projects = await client.listProjects({
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
            first: 100,
            after: cursor,
          });

          for (const project of projects.nodes) {
            options.push({ label: project.name, value: project.id });
          }

          hasNextPage = projects.pageInfo.hasNextPage;
          cursor = projects.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
  template_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Template',
      required,
      description: 'ID of Template',
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth || !team_id) {
          return {
            disabled: true,
            placeholder: 'connect your account first and select team',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const options: DropdownOption<string>[] = [];

        let hasNextPage = false;
        let cursor;

        do {
          const filter: Omit<
            LinearDocument.Team_TemplatesQueryVariables,
            'id'
          > = {
            first: 100,
            after: cursor,
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
          };
          const templatesConnection = await client.listTeamsTemplates(
            team_id as string,
            filter
          );

          const templates = await templatesConnection.nodes;

          for (const template of templates) {
            options.push({ label: template.name, value: template.id });
          }

          hasNextPage = templatesConnection.pageInfo.hasNextPage;
          cursor = templatesConnection.pageInfo.endCursor;
        } while (hasNextPage);

        return {
          disabled: false,
          options,
        };
      },
    }),
};
