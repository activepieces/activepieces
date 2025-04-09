import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { discordAuth } from '../../index'
import { discordCommon } from '../common'

export const discordAddRoleToMember = createAction({
  auth: discordAuth,
  name: 'add_role_to_member',
  description: 'Add Guild Member Role',
  displayName: 'Add role to member',
  props: {
    guild_id: discordCommon.guilds,
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user id of the member',
      required: true,
    }),
    role_id: discordCommon.roles,
  },

  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PUT,
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/members/${configValue.propsValue.user_id}/roles/${configValue.propsValue.role_id}`,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
      },
    }

    const res = await httpClient.sendRequest<never>(request)

    return {
      success: res.status === 204,
    }
  },
})
