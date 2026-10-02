import { DropdownOption, Property, tryCatch } from '@activepieces/pieces-framework';
import { makeClient } from './client';
import { LinearDocument } from '@linear/sdk';
import { linearAuth } from '../..';
import { LinearAuth, linearGraphql } from './graphql';
import { ALL_PROJECTS_QUERY, TEAM_CYCLES_QUERY } from './queries';

export const props = {
  team_id: (required = true, description = 'The team to work in.') =>
    Property.Dropdown({
auth: linearAuth,
      description,
      displayName: 'Team',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
auth: linearAuth,
      displayName: 'Status',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
auth: linearAuth,
      displayName: 'Labels',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const client = makeClient(auth);
        const teamLabels: DropdownOption<string>[] = [];
        const workspaceLabels: DropdownOption<string>[] = [];

        // Fetch team specific labels
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
            teamLabels.push({ label: label.name, value: label.id });
          }

          hasNextPage = labels.pageInfo.hasNextPage;
          cursor = labels.pageInfo.endCursor;
        } while (hasNextPage);

        // Fetch all workspace labels that are common to all teams
        hasNextPage = false;
        cursor = undefined;

        do {
          const labels = await client.listIssueLabels({
            filter: {
              team: {
                null: true,
              },
            },
            orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
            first: 100,
            after: cursor,
          });

          for (const label of labels.nodes) {
            // Prefix workspace labels with [Workspace]
            workspaceLabels.push({ label: `[Workspace] ${label.name}`, value: label.id });
          }

          hasNextPage = labels.pageInfo.hasNextPage;
          cursor = labels.pageInfo.endCursor;
        } while (hasNextPage);

        // team labels are displayed first in alphabetical order
        teamLabels.sort((a, b) => a.label.localeCompare(b.label));
        
        // followed by workspace labels in alphabetical order
        workspaceLabels.sort((a, b) => a.label.localeCompare(b.label));

        const options = [...teamLabels, ...workspaceLabels];

        return {
          disabled: false,
          options,
        };
      },
    }),
  team_ids: (required = false) =>
    Property.MultiSelectDropdown({
      auth: linearAuth,
      description: 'Fire only for these teams. Empty: every public team.',
      displayName: 'Teams',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
  author_ids: (required = false) =>
    Property.MultiSelectDropdown({
      auth: linearAuth,
      description: 'Fire only for comments by these people. Empty: anyone.',
      displayName: 'Authors',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
  assignee_id: (required = false) =>
    Property.Dropdown({
auth: linearAuth,
      displayName: 'Assignee',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
auth: linearAuth,
      displayName: 'Priority',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
        const priorities = await client.listIssuePriorities();

        return {
          disabled: false,
          options: priorities.map((priority) => {
            return {
              label: priority.label,
              value: priority.priority,
            };
          }),
        };
      },
    }),
  issue_id: (required = true, displayName = 'Issue', description = 'Type a key or title words to find older issues.') =>
    Property.Dropdown({
auth: linearAuth,
      displayName,
      required,
      description,
      refreshers: ['team_id'],
      refreshOnSearch: true,
      options: async ({ auth, team_id }, { searchValue }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const client = makeClient(auth);
        const teamFilter: LinearDocument.IssueFilter = {
          team: {
            id: {
              eq: team_id as string,
            },
          },
        };
        const term = searchValue?.trim();
        const key = term ? parseIssueKey({ term }) : undefined;
        const filter: LinearDocument.IssuesQueryVariables = {
          first: 50,
          filter: term
            ? {
                and: [
                  teamFilter,
                  {
                    or: [
                      { title: { containsIgnoreCase: term } },
                      ...(key
                        ? [
                            {
                              number: { eq: key.number },
                              ...(key.teamKey ? { team: { key: { eqIgnoreCase: key.teamKey } } } : {}),
                            },
                          ]
                        : []),
                    ],
                  },
                ],
              }
            : teamFilter,
          orderBy: LinearDocument.PaginationOrderBy.UpdatedAt,
        };
        const issues = await client.listIssues(filter);
        return {
          disabled: false,
          options: issues.nodes.map((issue: { identifier: string; title: string; id: string }) => {
            return {
              label: `${issue.identifier} · ${issue.title}`,
              value: issue.id,
            };
          }),
        };
      },
    }),

  issue_reference: () =>
    Property.ShortText({
      displayName: 'Issue',
      description: 'The key shown on the issue in Linear, or the issue ID.',
      placeholder: 'ENG-123',
      required: true,
    }),

  parent_issue_id: () =>
    Property.ShortText({
      displayName: 'Parent Issue',
      description: "The parent's key, ID or exact title.",
      placeholder: 'ENG-123',
      required: false,
    }),

  project_id: (required = true) =>
    Property.Dropdown({
auth: linearAuth,
      displayName: 'Project',
      required,
      description: 'The project to change.',
      refreshers: ['team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
  project_statuses: (required = false) =>
    Property.Dropdown({
      auth: linearAuth,
      displayName: 'Project Status',
      description: 'Fire only for this status. Empty: any status.',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const client = makeClient(auth);
        const statuses = await client.listProjectStatuses();
        return {
          disabled: false,
          options: statuses.map((s) => ({ label: s.name, value: s.name })),
        };
      },
    }),
  project_status: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Project Status',
      required,
      options: {
        disabled: false,
        options: [
          { label: 'Backlog', value: 'backlog' },
          { label: 'Planned', value: 'planned' },
          { label: 'In Progress', value: 'started' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
  template_id: (required = false) =>
    Property.Dropdown({
auth: linearAuth,
      displayName: 'Template',
      required,
      description: "Prefills the issue from one of the team's templates.",
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const client = makeClient(auth);
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
  project_health: (required = false) =>
    Property.StaticDropdown({
      displayName: 'Health',
      description: 'Leave empty to post without a health rating.',
      required,
      options: {
        options: [
          { label: 'On track', value: 'onTrack' },
          { label: 'At risk', value: 'atRisk' },
          { label: 'Off track', value: 'offTrack' },
        ],
      },
    }),
  label_id: (required = true) =>
    Property.Dropdown({
      auth: linearAuth,
      displayName: 'Label',
      description: 'Labels of the selected team, then workspace labels.',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const { data: options, error } = await tryCatch(() => loadLabelOptions({ auth, teamId: String(team_id) }));
        if (error) {
          return { disabled: true, placeholder: `Could not load labels: ${error.message}`, options: [] };
        }
        return { disabled: false, options };
      },
    }),
  cycle_id: (required = false) =>
    Property.Dropdown({
      auth: linearAuth,
      displayName: 'Cycle',
      description: 'Current and upcoming cycles of the selected team.',
      required,
      refreshers: ['auth', 'team_id'],
      options: async ({ auth, team_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        if (!team_id) {
          return {
            disabled: true,
            placeholder: 'Select a team first',
            options: [],
          };
        }
        const { data: options, error } = await tryCatch(() => loadCycleOptions({ auth, teamId: String(team_id) }));
        if (error) {
          return { disabled: true, placeholder: `Could not load cycles: ${error.message}`, options: [] };
        }
        return {
          disabled: false,
          options,
          placeholder: options.length === 0 ? 'This team has no current or upcoming cycles' : undefined,
        };
      },
    }),
  any_project_id: (required = false) =>
    Property.Dropdown({
      auth: linearAuth,
      displayName: 'Project',
      description: 'Fire only for updates on this project. Empty: every project.',
      required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Linear account first',
            options: [],
          };
        }
        const { data: options, error } = await tryCatch(() => loadProjectOptions({ auth }));
        if (error) {
          return { disabled: true, placeholder: `Could not load projects: ${error.message}`, options: [] };
        }
        return { disabled: false, options };
      },
    }),
};

function parseIssueKey({ term }: { term: string }): { teamKey?: string; number: number } | undefined {
  const match = /^(?:([A-Za-z0-9]+)-)?(\d+)$/.exec(term);
  if (!match) {
    return undefined;
  }
  return { teamKey: match[1], number: Number(match[2]) };
}

async function loadLabelOptions({ auth, teamId }: { auth: LinearAuth; teamId: string }): Promise<DropdownOption<string>[]> {
  const client = makeClient(auth);
  const teamLabels = await collectLabels({
    load: (after) =>
      client.listIssueLabels({
        filter: { team: { id: { eq: teamId } } },
        first: 100,
        after,
      }),
    prefix: '',
  });
  const workspaceLabels = await collectLabels({
    load: (after) =>
      client.listIssueLabels({
        filter: { team: { null: true } },
        first: 100,
        after,
      }),
    prefix: '[Workspace] ',
  });
  return [...teamLabels, ...workspaceLabels];
}

async function collectLabels({
  load,
  prefix,
}: {
  load: (after: string | undefined) => Promise<{
    nodes: Array<{ id: string; name: string }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string };
  }>;
  prefix: string;
}): Promise<DropdownOption<string>[]> {
  const options: DropdownOption<string>[] = [];
  let after: string | undefined;
  let hasNextPage = false;
  do {
    const page = await load(after);
    for (const label of page.nodes) {
      options.push({ label: `${prefix}${label.name}`, value: label.id });
    }
    hasNextPage = page.pageInfo.hasNextPage;
    after = page.pageInfo.endCursor;
  } while (hasNextPage);
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

async function loadCycleOptions({ auth, teamId }: { auth: LinearAuth; teamId: string }): Promise<DropdownOption<string>[]> {
  const options: DropdownOption<string>[] = [];
  let after: string | undefined;
  let hasNextPage = false;
  do {
    const data = await linearGraphql.request<{
      cycles: {
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
        nodes: Array<{ id: string; number: number; name?: string | null; startsAt: string; isActive: boolean; isNext: boolean; isPast: boolean }>;
      };
    }>({
      auth,
      query: TEAM_CYCLES_QUERY,
      variables: {
        filter: { team: { id: { eq: teamId } }, isPast: { eq: false } },
        first: 100,
        after,
      },
    });
    for (const cycle of data.cycles.nodes) {
      const status = cycle.isActive ? ' (current)' : cycle.isNext ? ' (next)' : '';
      const name = cycle.name ? ` ${cycle.name}` : '';
      options.push({
        label: `Cycle ${cycle.number}${name} · starts ${cycle.startsAt.slice(0, 10)}${status}`,
        value: cycle.id,
      });
    }
    hasNextPage = data.cycles.pageInfo.hasNextPage;
    after = data.cycles.pageInfo.endCursor ?? undefined;
  } while (hasNextPage);
  return options;
}

async function loadProjectOptions({ auth }: { auth: LinearAuth }): Promise<DropdownOption<string>[]> {
  const options: DropdownOption<string>[] = [];
  let after: string | undefined;
  let hasNextPage = false;
  do {
    const data = await linearGraphql.request<{
      projects: {
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
        nodes: Array<{ id: string; name: string }>;
      };
    }>({ auth, query: ALL_PROJECTS_QUERY, variables: { first: 100, after } });
    for (const project of data.projects.nodes) {
      options.push({ label: project.name, value: project.id });
    }
    hasNextPage = data.projects.pageInfo.hasNextPage;
    after = data.projects.pageInfo.endCursor ?? undefined;
  } while (hasNextPage);
  return options;
}
