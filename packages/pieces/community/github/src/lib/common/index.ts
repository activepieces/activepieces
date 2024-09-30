import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Octokit } from 'octokit';

export const githubCommon = {
  baseUrl: 'https://api.github.com',
  repositoryDropdown: Property.Dropdown<{ repo: string; owner: string }>({
    displayName: 'Repository',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const repositories = await getUserRepo(authProp);
      return {
        disabled: false,
        options: repositories.map((repo) => {
          return {
            label: repo.owner.login + '/' + repo.name,
            value: {
              owner: repo.owner.login,
              repo: repo.name,
            },
          };
        }),
      };
    },
  }),
  assigneeDropDown: (required = false) =>
    Property.MultiSelectDropdown({
      displayName: 'Assignees',
      description: 'Assignees for the Issue',
      refreshers: ['repository'],

      required,
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const { owner, repo } = repository as RepositoryProp;
        const assignees = await getAssignee(authProp, owner, repo);
        return {
          disabled: false,
          options: assignees.map((assignee) => {
            return {
              label: assignee.login,
              value: assignee.login,
            };
          }),
        };
      },
    }),
  labelDropDown: (required = false) =>
    Property.MultiSelectDropdown({
      displayName: 'Labels',
      description: 'Labels for the Issue',
      refreshers: ['repository'],
      required,
      options: async ({ auth, repository }) => {
        if (!auth || !repository) {
          return {
            disabled: true,
            options: [],
            placeholder: 'please authenticate first and select repo',
          };
        }
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const { owner, repo } = repository as RepositoryProp;
        const labels = await listIssueLabels(authProp, owner, repo);
        return {
          disabled: false,
          options: labels.map((label) => {
            return {
              label: label.name,
              value: label.name,
            };
          }),
        };
      },
    }),
};

async function getUserRepo(authProp: OAuth2PropertyValue) {
  const client = new Octokit({ auth: authProp.access_token });
  return await client.paginate(client.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
  });
}

async function getAssignee(
  authProp: OAuth2PropertyValue,
  owner: string,
  repo: string
) {
  const client = new Octokit({ auth: authProp.access_token });
  return await client.paginate(client.rest.issues.listAssignees, {
    owner,
    repo,
    per_page: 100,
  });
}

async function listIssueLabels(
  authProp: OAuth2PropertyValue,
  owner: string,
  repo: string
) {
  const client = new Octokit({ auth: authProp.access_token });
  return await client.paginate(client.rest.issues.listLabelsForRepo, {
    owner,
    repo,
    per_page: 100,
  });
}

export interface RepositoryProp {
  repo: string;
  owner: string;
}
