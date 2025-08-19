import { DropdownOption, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.usemotion.com/v1';

export const workspaceId =(displayName:string)=> Property.Dropdown({
  displayName,
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      workspaces: { id: string; name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/workspaces`,
      headers: {
        'X-API-Key': auth as string,
      },
    });

    return {
      disabled: false,
      options: response.body.workspaces.map((workspace) => ({
        label: workspace.name,
        value: workspace.id,
      })),
    };
  },
});

export const statusId = Property.Dropdown({
  displayName: 'Status',
  refreshers: ['workspaceId'],
  required: false,
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select workspace.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{ name: string }[]>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/statuses`,
      headers: {
        'X-API-Key': auth as string,
      },
      queryParams: {
        workspaceId: workspaceId as string,
      },
    });

    return {
      disabled: false,
      options: response.body.map((status) => ({
        label: status.name,
        value: status.name,
      })),
    };
  },
});

export const projectId = Property.Dropdown({
  displayName: 'Project',
  refreshers: ['workspaceId'],
  required: false,
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select workspace.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      projects: { id: string; name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/projects`,
      headers: {
        'X-API-Key': auth as string,
      },
      queryParams: {
        workspaceId: workspaceId as string,
      },
    });

    return {
      disabled: false,
      options: response.body.projects.map((project) => ({
        label: project.name,
        value: project.id,
      })),
    };
  },
});

export const userId = Property.Dropdown({
  displayName: 'Assignee',
  refreshers: ['workspaceId'],
  required: false,
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select workspace.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      users: { id: string; name: string }[];
    }>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/users`,
      headers: {
        'X-API-Key': auth as string,
      },
      queryParams: {
        workspaceId: workspaceId as string,
      },
    });

    return {
      disabled: false,
      options: response.body.users.map((user) => ({
        label: user.name,
        value: user.id,
      })),
    };
  },
});

export const taskId = Property.Dropdown({
  displayName: 'Task ID',
  refreshers: ['workspaceId'],
  required: true,
  options: async ({ auth, workspaceId }) => {
    if (!auth || !workspaceId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select workspace.',
        options: [],
      };
    }

    let nextCursor: string | undefined;

    const options: DropdownOption<string>[] = [];
    const qs: QueryParams = { workspaceId: workspaceId as string };

    do {
      if (nextCursor) {
        qs['cursor'] = nextCursor;
      }

      const response = await httpClient.sendRequest<{
        tasks: { id: string; name: string }[];
        meta: { pageSize: number; nextCursor?: string };
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/tasks`,
        headers: {
          'X-API-Key': auth as string,
        },
        queryParams: qs,
      });

      const tasks = response.body.tasks ?? [];
      for (const { id, name } of tasks) {
        options.push({ label: name, value: id });
      }

      nextCursor = response.body.meta.nextCursor;
    } while (nextCursor);

    return {
      disabled: false,
      options,
    };
  },
});

export const priority = Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
          disabled: false,
          options: [
            { label: 'ASAP', value: 'ASAP' },
            { label: 'HIGH', value: 'HIGH' },
            { label: 'MEDIUM', value: 'MEDIUM' },
            { label: 'LOW', value: 'LOW' },
          ],
  
      },
    })