import { pickBy } from 'lodash'
import { AuthenticationType } from '../../../../common/authentication/core/authentication-type'
import { isNotUndefined } from '../../../../common/helpers/assertions'
import { httpClient } from '../../../../common/http/core/http-client'
import { HttpMethod } from '../../../../common/http/core/http-method'
import { HttpRequest } from '../../../../common/http/core/http-request'
import { TodoistCompletedListResponse } from '../models'

const API = 'https://api.todoist.com/sync/v9'

export const todoistSyncClient = {
  completed: {
    async list({ token, since, projectId }: CompletedListParams): Promise<TodoistCompletedListResponse> {
      const queryParams = {
        limit: '200',
        since,
        project_id: projectId,
      }

      const request: HttpRequest<never> = {
        method: HttpMethod.GET,
        url: `${API}/completed/get_all`,
        queryParams: pickBy(queryParams, isNotUndefined),
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
      }

      const response = await httpClient.sendRequest<TodoistCompletedListResponse>(request)
      return response.body
    }
  }
}

type CompletedListParams = {
  token: string
  since: string | undefined
  projectId: string | undefined
}
