
import { getIssueTypes, getProjects, getUsers } from '.';
import { Property } from '@activepieces/pieces-framework';
import { JiraAuth } from '../../auth';

export function getProjectIdDropdown(data?: DropdownParams) {
  return Property.Dropdown({
    displayName: data?.displayName ?? 'Project',
    description: data?.description,
    required: data?.required ?? true,
    refreshers: data?.refreshers ?? [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
        };
      }

      const projects = await getProjects(auth as JiraAuth);
      return {
        options: projects.map((project) => {
          return {
            label: project.name,
            value: project.id,
          };
        }),
      };
    },
  });
}

export function getIssueTypeIdDropdown(data?: DropdownParams) {
  return Property.Dropdown({
    displayName: data?.displayName ?? 'Issue Type',
    description: data?.description,
    required: data?.required ?? true,
    refreshers: data?.refreshers ?? ['projectId'],
    options: async ({ auth, projectId }) => {
      if (!auth || !projectId) {
        return {
          options: [],
        };
      }

      const issueTypes = await getIssueTypes({
        auth: auth as JiraAuth,
        projectId: projectId as string,
      });
      return {
        options: issueTypes.map((issueType) => {
          return {
            label: issueType.name,
            value: issueType.id,
          };
        }),
      };
    },
  });
}

export function getUsersDropdown(data?: DropdownParams) {
  return Property.Dropdown({
    displayName: data?.displayName ?? 'User',
    description: data?.description,
    required: data?.required ?? true,
    refreshers: data?.refreshers ?? [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
        };
      }

      const users = (await getUsers(auth as JiraAuth)).filter(
        (user) => user.accountType === 'atlassian'
      );
      return {
        options: users.map((user) => {
          return {
            label: user.displayName,
            value: user.accountId,
          };
        }),
      };
    },
  });
}

export interface DropdownParams {
  required?: boolean;
  refreshers?: string[];
  displayName?: string;
  description?: string;
}
