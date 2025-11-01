import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

async function fireHttpRequest({
  method,
  path,
  body,
  auth,
}: {
  method: HttpMethod;
  path: string;
  auth: OAuth2PropertyValue;
  body?: unknown;
}) {
  return await httpClient
    .sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    })
    .then((res) => res.body)
    .catch((err) => {
      throw new Error(
        `Error in request to ${path}: ${err.message || JSON.stringify(err)}`
      );
    });
}

export const meisterTaskApiService = {
  async fetchAttachments({
    auth,
    taskId,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/tasks/${taskId}/attachments`,
      auth,
    });
  },
  async createAttachment({
    auth,
    taskId,
    payload,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/api/tasks/${taskId}/attachments`,
      auth,
      body: payload,
    });
  },
  async fetchComments({
    auth,
    taskId,
    queryString,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/tasks/${taskId}/comments${
        queryString ? `?${queryString}` : ''
      }`,
      auth,
    });
  },
  async fetchTaskLabels({
    auth,
    taskId,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/tasks/${taskId}/task_labels`,
      auth,
    });
  },
  async createTaskLabels({
    auth,
    taskId,
    label_id,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
    label_id: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/api/tasks/${taskId}/task_labels`,
      auth,
      body: {
        label_id,
      },
    });
  },
  async fetchTasks({
    auth,
    queryString,
  }: {
    auth: OAuth2PropertyValue;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/tasks${queryString ? `?${queryString}` : ''}`,
      auth,
    });
  },
  async createTask({
    auth,
    sectionId,
    payload,
  }: {
    auth: OAuth2PropertyValue;
    sectionId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/api/sections/${sectionId}/tasks`,
      auth,
      body: payload,
    });
  },
  async updateTask({
    auth,
    taskId,
    payload,
  }: {
    auth: OAuth2PropertyValue;
    taskId: string;
    payload: any;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.PUT,
      path: `/api/tasks/${taskId}`,
      auth,
      body: payload,
    });
  },
  async fetchProjects({
    auth,
    queryString,
  }: {
    auth: OAuth2PropertyValue;
    queryString?: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/projects${queryString ? `?${queryString}` : ''}`,
      auth,
    });
  },
  async fetchPersons({
    auth,
    projectId,
  }: {
    auth: OAuth2PropertyValue;
    projectId?: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: projectId ? `/api/projects/${projectId}/persons` : '/api/persons',
      auth,
    });
  },
  async fetchPersonById({
    auth,
    personId,
  }: {
    auth: OAuth2PropertyValue;
    personId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/persons/${personId}`,
      auth,
    });
  },
  async fetchMe({ auth }: { auth: OAuth2PropertyValue }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: '/api/persons/me',
      auth,
    });
  },
  async fetchLabels({
    auth,
    projectId,
  }: {
    auth: OAuth2PropertyValue;
    projectId: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/projects/${projectId}/labels`,
      auth,
    });
  },
  async createLabel({
    auth,
    projectId,
    payload,
  }: {
    auth: OAuth2PropertyValue;
    projectId: string;
    payload: {
      name: string;
      color?: string;
    };
  }) {
    return await fireHttpRequest({
      method: HttpMethod.POST,
      path: `/api/projects/${projectId}/labels`,
      auth,
      body: payload,
    });
  },
  async fetchSections({
    auth,
    projectId,
    queryString,
  }: {
    auth: OAuth2PropertyValue;
    projectId?: string;
    queryString?: string;
  }) {
    const url = projectId
      ? `/api/projects/${projectId}/sections`
      : '/api/sections';

    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `${url}${queryString ? `?${queryString}` : ''}`,
      auth,
    });
  },
  async fetchTaskCheckListItem({
    auth,
    taskId,
    queryString,
  }: {
    auth: OAuth2PropertyValue;
    taskId?: string;
    queryString: string;
  }) {
    return await fireHttpRequest({
      method: HttpMethod.GET,
      path: `/api/tasks/${taskId}/checklist_items?${queryString}`,
      auth,
    });
  },
};
