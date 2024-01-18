import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/shared';
import { TodoistCompletedListResponse } from '../models';

const API = 'https://api.todoist.com/sync/v9';

export const todoistSyncClient = {
  completed: {
    async list({
      token,
      since,
      project_id,
      until,
    }: CompletedListParams): Promise<TodoistCompletedListResponse> {
      const queryParams = {
        limit: '200',
        since,
        until,
        project_id,
      };

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${API}/completed/get_all`,
        queryParams: pickBy(queryParams, isNotUndefined),
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      };

      const response =
        await httpClient.sendRequest<TodoistCompletedListResponse>(request);
      return response.body;
    },
  },
};

type CompletedListParams = {
  token: string;
  since: string;
  until: string;
  project_id: string | undefined;
};
