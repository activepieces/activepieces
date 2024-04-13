import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';

export const discordCreateGuildRole = createAction({
  auth: discordAuth,
  name: 'createGuildRole',
  displayName: 'Create guild role',
  description: 'Creates a new role on the specified guild',
  props: {
    guild_id: discordCommon.guilds,
    role_name: Property.ShortText({
      displayName: 'Role Name',
      description: 'The name of the role',
      required: true,
    }),
    role_color: Property.ShortText({
      displayName: 'Role Color',
      description: `The RGB color of the role (may be better to set manually on the server)`,
      required: false,
    }),
    display_separated: Property.Checkbox({
      displayName: 'Display Separated',
      description:
        'Whether the role should be displayed separately in the sidebar',
      required: false,
    }),
    role_mentionable: Property.Checkbox({
      displayName: 'Mentionable',
      description: 'Whether the role can be mentioned by other users',
      required: false,
    }),
    creation_reason: Property.ShortText({
      displayName: 'Creation Reason',
      description: 'The reason for creating the role',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest = {
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles`,
      method: HttpMethod.POST,
      headers: {
        authorization: `Bot ${configValue.auth}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': `${configValue.propsValue.creation_reason}`,
      },
      body: {
        name: configValue.propsValue.role_name,
        color: configValue.propsValue.role_color,
        hoist: configValue.propsValue.display_separated,
        mentionable: configValue.propsValue.role_mentionable,
      },
    };

    const res = await httpClient.sendRequest(request);

    return {
      success: res.status === 201,
      role: {
        id: res.body.id,
        name: res.body.name,
      },
    };
  },
});
