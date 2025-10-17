import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const createUser = createAction({
  auth: cyberarkAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Creates a new user in the CyberArk Vault',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The name of the user (max 128 characters)',
      required: true,
    }),
    userType: Property.ShortText({
      displayName: 'User Type',
      description: 'The user type according to license',
      required: false,
      defaultValue: 'EPVUser',
    }),
    initialPassword: Property.ShortText({
      displayName: 'Initial Password',
      description: 'Password for first-time login (max 39 characters)',
      required: false,
    }),
    authenticationMethod: Property.StaticMultiSelectDropdown({
      displayName: 'Authentication Method',
      description: 'The authentication method for login',
      required: false,
      options: {
        options: [
          { label: 'CyberArk', value: 'AuthTypePass' },
          { label: 'Radius', value: 'AuthTypeRadius' },
          { label: 'LDAP', value: 'AuthTypeLDAP' },
        ],
      },
      defaultValue: ['AuthTypePass'],
    }),
    allowedAuthenticationMethods: Property.StaticMultiSelectDropdown({
      displayName: 'Allowed Authentication Methods',
      description: 'Non-Vault authentication methods the user can use',
      required: false,
      options: {
        options: [
          { label: 'SAML', value: 'SAML' },
          { label: 'PKI', value: 'PKI' },
        ],
      },
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Vault location for user creation (must start with \\\\)',
      required: false,
      defaultValue: '\\\\',
    }),
    enableUser: Property.Checkbox({
      displayName: 'Enable User',
      description: 'Whether the user will be enabled upon creation',
      required: false,
      defaultValue: true,
    }),
    changePassOnNextLogon: Property.Checkbox({
      displayName: 'Change Password on Next Logon',
      description: 'User must change password on next login',
      required: false,
      defaultValue: true,
    }),
    passwordNeverExpires: Property.Checkbox({
      displayName: 'Password Never Expires',
      description: 'Password will not expire unless user changes it',
      required: false,
      defaultValue: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Notes and comments (max 99 characters)',
      required: false,
    }),
    vaultAuthorization: Property.StaticMultiSelectDropdown({
      displayName: 'Vault Authorization',
      description: 'User permissions',
      required: false,
      options: {
        options: [
          { label: 'Add Safes', value: 'AddSafes' },
          { label: 'Audit Users', value: 'AuditUsers' },
          { label: 'Add Update Users', value: 'AddUpdateUsers' },
          { label: 'Reset Users Passwords', value: 'ResetUsersPasswords' },
          { label: 'Activate Users', value: 'ActivateUsers' },
          { label: 'Add Network Areas', value: 'AddNetworkAreas' },
          { label: 'Manage Directory Mapping', value: 'ManageDirectoryMapping' },
          { label: 'Manage Server File Categories', value: 'ManageServerFileCategories' },
          { label: 'Backup All Safes', value: 'BackupAllSafes' },
          { label: 'Restore All Safes', value: 'RestoreAllSafes' },
        ],
      },
    }),
    // Personal Details
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (max 29 characters)',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'Middle name (max 29 characters)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (max 29 characters)',
      required: false,
    }),
    // Contact Information
    homeEmail: Property.ShortText({
      displayName: 'Home Email',
      description: 'Home email address (max 319 characters)',
      required: false,
    }),
    businessEmail: Property.ShortText({
      displayName: 'Business Email',
      description: 'Business email address (max 319 characters)',
      required: false,
    }),
    homeNumber: Property.ShortText({
      displayName: 'Home Phone',
      description: 'Home phone number (max 24 characters)',
      required: false,
    }),
    businessNumber: Property.ShortText({
      displayName: 'Business Phone',
      description: 'Business phone number (max 24 characters)',
      required: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth as CyberArkAuth);

    // Build the request body
    const requestBody: any = {
      username: context.propsValue.username,
      userType: context.propsValue.userType || 'EPVUser',
      enableUser: context.propsValue.enableUser ?? true,
      changePassOnNextLogon: context.propsValue.changePassOnNextLogon ?? true,
      passwordNeverExpires: context.propsValue.passwordNeverExpires ?? false,
    };

    // Add optional fields if provided
    if (context.propsValue.initialPassword) {
      requestBody.initialPassword = context.propsValue.initialPassword;
    }
    if (context.propsValue.authenticationMethod) {
      requestBody.authenticationMethod = context.propsValue.authenticationMethod;
    }
    if (context.propsValue.allowedAuthenticationMethods) {
      requestBody.allowedAuthenticationMethods = context.propsValue.allowedAuthenticationMethods;
    }
    if (context.propsValue.location) {
      requestBody.location = context.propsValue.location;
    }
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    if (context.propsValue.vaultAuthorization) {
      requestBody.vaultAuthorization = context.propsValue.vaultAuthorization;
    }

    // Add personal details if any are provided
    const personalDetails: any = {};
    if (context.propsValue.firstName) personalDetails.firstName = context.propsValue.firstName;
    if (context.propsValue.middleName) personalDetails.middleName = context.propsValue.middleName;
    if (context.propsValue.lastName) personalDetails.lastName = context.propsValue.lastName;
    if (Object.keys(personalDetails).length > 0) {
      requestBody.personalDetails = personalDetails;
    }

    // Add internet details if any are provided
    const internet: any = {};
    if (context.propsValue.homeEmail) internet.homeEmail = context.propsValue.homeEmail;
    if (context.propsValue.businessEmail) internet.businessEmail = context.propsValue.businessEmail;
    if (Object.keys(internet).length > 0) {
      requestBody.internet = internet;
    }

    // Add phone details if any are provided
    const phones: any = {};
    if (context.propsValue.homeNumber) phones.homeNumber = context.propsValue.homeNumber;
    if (context.propsValue.businessNumber) phones.businessNumber = context.propsValue.businessNumber;
    if (Object.keys(phones).length > 0) {
      requestBody.phones = phones;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${authData.serverUrl}/PasswordVault/API/Users`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authData.token,
        },
        body: requestBody,
      });

      if (response.status === 201) {
        return {
          success: true,
          user: response.body,
        };
      } else {
        return {
          success: false,
          error: `Failed to create user. Status: ${response.status}`,
          details: response.body,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});