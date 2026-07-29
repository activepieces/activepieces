import { Property } from '@activepieces/pieces-framework';
import { listConnections, platformOf } from './client';

/**
 * The social accounts connected to the Publora account, as a picker.
 * A channel whose access token expired is left out: posting to it fails.
 */
export const channelIdsProp = Property.MultiSelectDropdown({
  displayName: 'Channels',
  description: 'The connected social accounts to post to.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Publora account first.',
      };
    }

    const { connections } = await listConnections(auth as string);
    const usable = connections.filter(
      (connection) => connection.tokenStatus === 'valid'
    );

    if (usable.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder:
          'No usable channels. Connect a social account in Publora first.',
      };
    }

    return {
      disabled: false,
      options: usable.map((connection) => {
        const platform = platformOf(connection.platformId);
        return {
          label: `${
            platform.charAt(0).toUpperCase() + platform.slice(1)
          } · ${connection.username}`,
          value: connection.platformId,
        };
      }),
    };
  },
});
