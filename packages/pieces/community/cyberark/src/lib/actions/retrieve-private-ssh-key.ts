import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken } from '../common/auth-helper';
import { accountIdDropdown } from '../common/account-dropdown';

interface RetrieveSSHKeyBody {
  reason?: string;
  TicketingSystemName?: string;
  TicketId?: string;
  Version?: number;
  ActionType?: string;
  isUse?: boolean;
  Machine?: string;
}

export const retrievePrivateSSHKey = createAction({
  auth: cyberarkAuth,
  name: 'retrieve_private_ssh_key',
  displayName: 'Retrieve Private SSH Key',
  description:
    'Retrieves a private SSH key file from an existing account identified by its Account ID',
  props: {
    accountId: accountIdDropdown,
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'The reason for retrieving the private SSH key',
      required: false,
    }),
    ticketingSystemName: Property.ShortText({
      displayName: 'Ticketing System Name',
      description: 'The name of the ticketing system',
      required: false,
    }),
    ticketId: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'The ticket ID defined in the ticketing system',
      required: false,
    }),
    version: Property.Number({
      displayName: 'Version',
      description:
        'The version number of the required SSH key. Must be a positive number. If left empty or the value does not exist, the current SSH key version is returned.',
      required: false,
    }),
    actionType: Property.StaticDropdown({
      displayName: 'Action Type',
      description: 'The action this SSH key is used for',
      required: false,
      options: {
        options: [
          { label: 'Download', value: 'download' },
        ],
      },
    }),
    isUse: Property.Checkbox({
      displayName: 'Is Use',
      description: 'Internal parameter (for use of PSMP only)',
      required: false,
      defaultValue: false,
    }),
    machine: Property.ShortText({
      displayName: 'Machine',
      description:
        'The address of the remote machine to connect to using the SSH key',
      required: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const requestBody: RetrieveSSHKeyBody = {
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
        url: `${authData.serverUrl}/PasswordVault/API/Accounts/${context.propsValue.accountId}/Secret/Retrieve/`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token,
        },
        body: requestBody,
      });

      if (response.status === 200) {
        return {
          success: true,
          sshKey: response.body,
        };
      } else {
        return {
          success: false,
          error: `Failed to retrieve SSH key. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to retrieve SSH key',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
