import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';
import { accountIdDropdown } from '../common/account-dropdown';

interface RetrievePasswordBody {
  reason?: string;
  TicketingSystemName?: string;
  TicketId?: string;
  Version?: number;
  ActionType?: string;
  isUse?: boolean;
  Machine?: string;
}

export const getPasswordValue = createAction({
  auth: cyberarkAuth,
  name: 'get_password_value',
  displayName: 'Get Password Value',
  description:
    'Retrieves the password or SSH key of an existing account identified by its Account ID',
  props: {
    accountId: accountIdDropdown,
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'The reason for retrieving the password/SSH key',
      required: false,
    }),
    ticketingSystemName: Property.ShortText({
      displayName: 'Ticketing System Name',
      description: 'The name of the Ticketing System',
      required: false,
    }),
    ticketId: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ticket ID of the ticketing system',
      required: false,
    }),
    version: Property.Number({
      displayName: 'Version',
      description:
        'The version number of the required password. If there are no previous versions, the current password/key version is returned.',
      required: false,
    }),
    actionType: Property.StaticDropdown({
      displayName: 'Action Type',
      description: 'The action this password will be used for',
      required: false,
      options: {
        options: [
          { label: 'Show', value: 'show' },
          { label: 'Copy', value: 'copy' },
          { label: 'Connect', value: 'connect' },
        ],
      },
    }),
    isUse: Property.Checkbox({
      displayName: 'Is Use',
      description: 'Internal parameter (for PSM for SSH only)',
      required: false,
      defaultValue: false,
    }),
    machine: Property.ShortText({
      displayName: 'Machine',
      description: 'The address of the remote machine to connect to',
      required: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const requestBody: RetrievePasswordBody = {
      ...(context.propsValue.reason && { reason: context.propsValue.reason }),
      ...(context.propsValue.ticketingSystemName && { TicketingSystemName: context.propsValue.ticketingSystemName }),
      ...(context.propsValue.ticketId && { TicketId: context.propsValue.ticketId }),
      ...(context.propsValue.version != null && { Version: context.propsValue.version }),
      ...(context.propsValue.actionType && { ActionType: context.propsValue.actionType }),
      ...(context.propsValue.isUse != null && { isUse: context.propsValue.isUse }),
      ...(context.propsValue.machine && { Machine: context.propsValue.machine }),
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/${context.propsValue.accountId}/Password/Retrieve/`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
        body: requestBody,
      });

      if (response.status === 200) {
        return {
          success: true,
          password: response.body,
        };
      } else {
        return {
          success: false,
          error: `Failed to retrieve password. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve password',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
