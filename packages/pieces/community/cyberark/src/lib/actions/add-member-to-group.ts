import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { groupIdDropdown } from '../common/group-dropdown';
import { memberIdDropdown } from '../common/member-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const addMemberToGroup = createAction({
  auth: cyberarkAuth,
  name: 'add_member_to_group',
  displayName: 'Add Member to Group',
  description: 'Adds a user as a member to an existing Vault group (requires Add/Update users permissions)',
  props: {
    groupId: groupIdDropdown,
    memberId: memberIdDropdown,
    memberType: Property.StaticDropdown({
      displayName: 'Member Type',
      description: 'The type of user being added to the Vault group',
      required: true,
      options: {
        options: [
          { label: 'Vault User', value: 'Vault' },
          { label: 'Domain User', value: 'domain' },
        ],
      },
      defaultValue: 'Vault',
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The DNS address of the domain (required if memberType is domain)',
      required: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    if (!context.propsValue.memberId) {
      return {
        success: false,
        error: 'Member ID is required. Please select or enter a member.',
      };
    }

    if (context.propsValue.memberType === 'domain' && !context.propsValue.domainName) {
      return {
        success: false,
        error: 'Domain name is required when member type is "domain"',
      };
    }

    const requestBody: any = {
      memberId: context.propsValue.memberId,
      memberType: context.propsValue.memberType,
    };

    if (context.propsValue.domainName) {
      requestBody.domainName = context.propsValue.domainName;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/UserGroups/${context.propsValue.groupId}/Members/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
        body: requestBody,
      });

      if (response.status === 201 || response.status === 200) {
        return {
          success: true,
          member: response.body,
          message: `Successfully added ${context.propsValue.memberId} to group ${context.propsValue.groupId}`,
        };
      } else {
        return {
          success: false,
          error: `Failed to add member to group. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add member to group',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});