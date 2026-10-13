import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discordCommon } from '../common';
import { discordRoleActionOutputSchema } from '../output-schemas';

export const discordCreateGuildRole = createAction({
  auth: discordAuth,
  name: 'createGuildRole',
  classification: 'WRITE',
  displayName: 'Create Role',
  description: 'Create a role in a server.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new role in a guild with the given name and optional color, hoist, and mentionable settings, identified by guild ID. Use to provision a role before assigning it to members. Requires the bot to have Manage Roles permission; not idempotent, since each call creates a separate role even with the same name.', idempotent: false },
  outputSchema: discordRoleActionOutputSchema,
  props: {
    guild_id: discordCommon.guilds,
    role_name: Property.ShortText({
      displayName: 'Name',
      placeholder: 'Moderators',
      required: true,
    }),
    role_color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex like #5865F2 or a decimal RGB number.',
      placeholder: '#5865F2',
      required: false,
      advanced: true,
    }),
    display_separated: Property.Checkbox({
      displayName: 'Show Separately',
      description: 'Lists members with this role in their own sidebar group.',
      required: false,
      advanced: true,
    }),
    role_mentionable: Property.Checkbox({
      displayName: 'Mentionable',
      description: 'Lets anyone @mention this role.',
      required: false,
      advanced: true,
    }),
    creation_reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Recorded in the server audit log.',
      required: false,
      advanced: true,
    }),
  },
  async run(configValue) {
    const reason = configValue.propsValue.creation_reason;
    const color = toColorInteger({ color: configValue.propsValue.role_color });

    const request: HttpRequest = {
      url: `https://discord.com/api/v9/guilds/${configValue.propsValue.guild_id}/roles`,
      method: HttpMethod.POST,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
        ...(reason ? { 'X-Audit-Log-Reason': reason } : {}),
      },
      body: {
        name: configValue.propsValue.role_name,
        ...(color === undefined ? {} : { color }),
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

function toColorInteger({
  color,
}: {
  color: string | undefined;
}): number | undefined {
  const trimmed = color?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^\d+$/.test(trimmed)) {
    const decimal = Number(trimmed);
    if (decimal > MAX_COLOR_VALUE) {
      throw new Error(`Color must be between 0 and ${MAX_COLOR_VALUE}, received "${trimmed}".`);
    }
    return decimal;
  }

  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return parseInt(hex, 16);
  }

  throw new Error(`Color must be a hex value like #5865F2 or a decimal RGB number, received "${trimmed}".`);
}

const MAX_COLOR_VALUE = 0xffffff;
