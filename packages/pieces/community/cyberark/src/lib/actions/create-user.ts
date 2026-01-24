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
    authenticationMethod: Property.StaticDropdown({
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
      defaultValue: 'AuthTypePass',
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
    cellularNumber: Property.ShortText({
      displayName: 'Cellular Phone',
      description: 'Cellular phone number (max 24 characters)',
      required: false,
    }),
    faxNumber: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Fax number (max 24 characters)',
      required: false,
    }),
    pagerNumber: Property.ShortText({
      displayName: 'Pager Number',
      description: 'Pager number (max 24 characters)',
      required: false,
    }),
    expiryDate: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'Date when the user expires',
      required: false,
    }),
    unAuthorizedInterfaces: Property.StaticMultiSelectDropdown({
      displayName: 'Unauthorized Interfaces',
      description: 'Interfaces the user cannot access',
      required: false,
      options: {
        options: [
          { label: 'PSM', value: 'PSM' },
          { label: 'PSMP', value: 'PSMP' },
          { label: 'PVWA', value: 'PVWA' },
          { label: 'WINCLIENT', value: 'WINCLIENT' },
          { label: 'PTA', value: 'PTA' },
          { label: 'PACLI', value: 'PACLI' },
          { label: 'HTTPGW', value: 'HTTPGW' },
          { label: 'EVD', value: 'EVD' },
          { label: 'PIMSu', value: 'PIMSu' },
          { label: 'AIMApp', value: 'AIMApp' },
          { label: 'CPM', value: 'CPM' },
          { label: 'PVWAApp', value: 'PVWAApp' },
          { label: 'PSMApp', value: 'PSMApp' },
          { label: 'AppPrv', value: 'AppPrv' },
          { label: 'PSMPApp', value: 'PSMPApp' },
        ],
      },
    }),
    workStreet: Property.ShortText({
      displayName: 'Work Street',
      description: 'Business street address (max 29 characters)',
      required: false,
    }),
    workCity: Property.ShortText({
      displayName: 'Work City',
      description: 'Business city (max 19 characters)',
      required: false,
    }),
    workState: Property.ShortText({
      displayName: 'Work State',
      description: 'Business state (max 19 characters)',
      required: false,
    }),
    workZip: Property.ShortText({
      displayName: 'Work ZIP',
      description: 'Business ZIP code (max 19 characters)',
      required: false,
    }),
    workCountry: Property.ShortText({
      displayName: 'Work Country',
      description: 'Business country (max 19 characters)',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Home Street',
      description: 'Home street address (max 29 characters)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'Home City',
      description: 'Home city (max 19 characters)',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'Home State',
      description: 'Home state (max 19 characters)',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Home ZIP',
      description: 'Home ZIP code (max 19 characters)',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Home Country',
      description: 'Home country (max 19 characters)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Professional title (max 49 characters)',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization name (max 49 characters)',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'Department (max 49 characters)',
      required: false,
    }),
    profession: Property.ShortText({
      displayName: 'Profession',
      description: 'Profession (max 49 characters)',
      required: false,
    }),
    homePage: Property.ShortText({
      displayName: 'Home Page',
      description: 'Personal website (max 319 characters)',
      required: false,
    }),
    otherEmail: Property.ShortText({
      displayName: 'Other Email',
      description: 'Additional email address (max 319 characters)',
      required: false,
    }),
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const requestBody: any = {
      username: context.propsValue.username,
      userType: context.propsValue.userType || 'EPVUser',
      enableUser: context.propsValue.enableUser ?? true,
      changePassOnNextLogon: context.propsValue.changePassOnNextLogon ?? true,
      passwordNeverExpires: context.propsValue.passwordNeverExpires ?? false,
    };

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
    if (context.propsValue.expiryDate) {
      requestBody.expiryDate = Math.floor(new Date(context.propsValue.expiryDate).getTime() / 1000);
    }
    if (context.propsValue.unAuthorizedInterfaces) {
      requestBody.unAuthorizedInterfaces = context.propsValue.unAuthorizedInterfaces;
    }
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    if (context.propsValue.vaultAuthorization) {
      requestBody.vaultAuthorization = context.propsValue.vaultAuthorization;
    }

    const personalDetails: any = {};
    if (context.propsValue.firstName) personalDetails.firstName = context.propsValue.firstName;
    if (context.propsValue.middleName) personalDetails.middleName = context.propsValue.middleName;
    if (context.propsValue.lastName) personalDetails.lastName = context.propsValue.lastName;
    if (context.propsValue.street) personalDetails.street = context.propsValue.street;
    if (context.propsValue.city) personalDetails.city = context.propsValue.city;
    if (context.propsValue.state) personalDetails.state = context.propsValue.state;
    if (context.propsValue.zip) personalDetails.zip = context.propsValue.zip;
    if (context.propsValue.country) personalDetails.country = context.propsValue.country;
    if (context.propsValue.title) personalDetails.title = context.propsValue.title;
    if (context.propsValue.organization) personalDetails.organization = context.propsValue.organization;
    if (context.propsValue.department) personalDetails.department = context.propsValue.department;
    if (context.propsValue.profession) personalDetails.profession = context.propsValue.profession;
    if (Object.keys(personalDetails).length > 0) {
      requestBody.personalDetails = personalDetails;
    }

    const internet: any = {};
    if (context.propsValue.homePage) internet.homePage = context.propsValue.homePage;
    if (context.propsValue.homeEmail) internet.homeEmail = context.propsValue.homeEmail;
    if (context.propsValue.businessEmail) internet.businessEmail = context.propsValue.businessEmail;
    if (context.propsValue.otherEmail) internet.otherEmail = context.propsValue.otherEmail;
    if (Object.keys(internet).length > 0) {
      requestBody.internet = internet;
    }

    const phones: any = {};
    if (context.propsValue.homeNumber) phones.homeNumber = context.propsValue.homeNumber;
    if (context.propsValue.businessNumber) phones.businessNumber = context.propsValue.businessNumber;
    if (context.propsValue.cellularNumber) phones.cellularNumber = context.propsValue.cellularNumber;
    if (context.propsValue.faxNumber) phones.faxNumber = context.propsValue.faxNumber;
    if (context.propsValue.pagerNumber) phones.pagerNumber = context.propsValue.pagerNumber;
    if (Object.keys(phones).length > 0) {
      requestBody.phones = phones;
    }

    const businessAddress: any = {};
    if (context.propsValue.workStreet) businessAddress.workStreet = context.propsValue.workStreet;
    if (context.propsValue.workCity) businessAddress.workCity = context.propsValue.workCity;
    if (context.propsValue.workState) businessAddress.workState = context.propsValue.workState;
    if (context.propsValue.workZip) businessAddress.workZip = context.propsValue.workZip;
    if (context.propsValue.workCountry) businessAddress.workCountry = context.propsValue.workCountry;
    if (Object.keys(businessAddress).length > 0) {
      requestBody.businessAddress = businessAddress;
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