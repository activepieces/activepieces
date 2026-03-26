import { Property } from "@activepieces/pieces-framework";
import { giteaAuth } from "../auth";
import { HttpMethod } from "@activepieces/pieces-common";
import { giteaPaginatedApiCall } from "./client";

export const giteaCommon = {
  repositoryDropdown: Property.Dropdown({
    displayName: 'Repository',
    refreshers: [],
    auth: giteaAuth,
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const repositories = await giteaPaginatedApiCall<GiteaRepository>({
        auth: auth,
        method: HttpMethod.GET,
        resourceUri: '/user/repos',
      });
      return {
        disabled: false,
        options: repositories.map((repo) => {
          return {
            label: repo.full_name,
            value: {
              owner: repo.owner.login,
              repo: repo.name,
            },
          };
        }),
      };
    },
  }),
  branchDropdown: Property.Dropdown({
    displayName: 'Branch',
    description: 'Filter by branch',
    required: false,
    refreshers: ['repository'],
    auth: giteaAuth,
    options: async ({ auth, repository }) => {
      if (!auth || !repository) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a repository first',
        };
      }
      const { owner, repo } = repository as { owner: string; repo: string };
      const branches = await giteaPaginatedApiCall<GiteaBranch>({
        auth: auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/branches`,
      });
      return {
        disabled: false,
        options: branches.map((branch) => {
          return {
            label: branch.name,
            value: branch.name,
          };
        }),
      };
    },
  }),
};

export type GiteaRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
};

export type GiteaBranch = {
  name: string;
};