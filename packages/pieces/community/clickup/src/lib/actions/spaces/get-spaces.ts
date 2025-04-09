import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { clickupAuth } from '../../../'
import { callClickUpApi, clickupCommon } from '../../common'

export const getClickupSpaces = createAction({
  auth: clickupAuth,
  name: 'get_spaces',
  description: 'Gets spaces in a ClickUp workspace',
  displayName: 'Get Spaces',
  props: {
    team_id: clickupCommon.workspace_id(),
  },
  async run(configValue) {
    const { team_id } = configValue.propsValue
    const response = await callClickUpApi(
      HttpMethod.GET,
      `team/${team_id}/space`,
      getAccessTokenOrThrow(configValue.auth),
      {},
    )

    return response.body
  },
})
