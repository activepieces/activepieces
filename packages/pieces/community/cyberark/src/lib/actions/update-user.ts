import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { userIdDropdown } from '../common/user-dropdown';
import { getAuthToken, CyberArkAuth } from '../common/auth-helper';

export const updateUser = createAction({
  auth: cyberarkAuth,
  name: 'update_user',
  displayName: 'Update User',
  description:
    'Updates an existing Vault user (except Master and Batch built-in users)',
  props: {
    userId: userIdDropdown,
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The name of the user (max 128 characters)',
      required: true
    }),
    userType: Property.ShortText({
      displayName: 'User Type',
      description: 'The user type according to license',
      required: false,
      defaultValue: 'EPVUser'
    }),
    enableUser: Property.Checkbox({
      displayName: 'Enable User',
      description: 'Whether the user is enabled',
      required: false,
      defaultValue: true
    }),
    changePassOnNextLogon: Property.Checkbox({
      displayName: 'Change Password on Next Logon',
      description: 'User must change password on next login',
      required: false,
      defaultValue: true
    }),
    passwordNeverExpires: Property.Checkbox({
      displayName: 'Password Never Expires',
      description: 'Password will not expire unless user changes it',
      required: false,
      defaultValue: false
    }),
    suspended: Property.Checkbox({
      displayName: 'Suspended',
      description: 'Whether the user is suspended',
      required: false,
      defaultValue: false
    }),
    expiryDate: Property.DateTime({
      displayName: 'Expiry Date',
      description: 'Date when the user expires',
      required: false
    }),
    userActivityLogRetentionDays: Property.Number({
      displayName: 'Activity Log Retention Days',
      description: 'Days to retain user activity records (default: 90)',
      required: false,
      defaultValue: 90
    }),
    authenticationMethod: Property.StaticDropdown({
      displayName: 'Authentication Method',
      description: 'The authentication method for login',
      required: false,
      options: {
        options: [
          { label: 'CyberArk', value: 'AuthTypePass' },
          { label: 'Radius', value: 'AuthTypeRadius' },
          { label: 'LDAP', value: 'AuthTypeLDAP' }
        ]
      },
      defaultValue: 'AuthTypePass'
    }),
    allowedAuthenticationMethods: Property.StaticMultiSelectDropdown({
      displayName: 'Allowed Authentication Methods',
      description: 'Non-Vault authentication methods the user can use',
      required: false,
      options: {
        options: [
          { label: 'SAML', value: 'SAML' },
          { label: 'PKI', value: 'PKI' }
        ]
      }
    }),
    unAuthorizedInterfaces: Property.StaticMultiSelectDropdown({
      displayName: 'Unauthorized Interfaces',
      description: 'CyberArk interfaces this user cannot access',
      required: false,
      options: {
        options: [
          { label: 'PIMSU', value: 'PIMSU' },
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
          { label: 'PSMPApp', value: 'PSMPApp' }
        ]
      }
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Vault location (must start with \\\\)',
      required: false,
      defaultValue: '\\\\'
    }),
    distinguishedName: Property.ShortText({
      displayName: 'Distinguished Name',
      description: 'Distinguished name for PKI authentication',
      required: false
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'New password for the user (max 39 characters)',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Notes and comments (max 99 characters)',
      required: false
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
          {
            label: 'Manage Directory Mapping',
            value: 'ManageDirectoryMapping'
          },
          {
            label: 'Manage Server File Categories',
            value: 'ManageServerFileCategories'
          },
          { label: 'Backup All Safes', value: 'BackupAllSafes' },
          { label: 'Restore All Safes', value: 'RestoreAllSafes' }
        ]
      }
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (max 29 characters)',
      required: false
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'Middle name (max 29 characters)',
      required: false
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (max 29 characters)',
      required: false
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title (max 49 characters)',
      required: false
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Organization (max 49 characters)',
      required: false
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'Department (max 49 characters)',
      required: false
    }),
    profession: Property.ShortText({
      displayName: 'Profession',
      description: 'Profession (max 49 characters)',
      required: false
    }),
    street: Property.ShortText({
      displayName: 'Street',
      description: 'Street address (max 29 characters)',
      required: false
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City (max 19 characters)',
      required: false
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State (max 19 characters)',
      required: false
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP code (max 19 characters)',
      required: false
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country (max 19 characters)',
      required: false
    }),
    workStreet: Property.ShortText({
      displayName: 'Work Street',
      description: 'Work street address (max 29 characters)',
      required: false
    }),
    workCity: Property.ShortText({
      displayName: 'Work City',
      description: 'Work city (max 19 characters)',
      required: false
    }),
    workState: Property.ShortText({
      displayName: 'Work State',
      description: 'Work state (max 19 characters)',
      required: false
    }),
    workZip: Property.ShortText({
      displayName: 'Work ZIP',
      description: 'Work ZIP code (max 19 characters)',
      required: false
    }),
    workCountry: Property.ShortText({
      displayName: 'Work Country',
      description: 'Work country (max 19 characters)',
      required: false
    }),
    homePage: Property.ShortText({
      displayName: 'Home Page',
      description: 'Home page URL (max 319 characters)',
      required: false
    }),
    homeEmail: Property.ShortText({
      displayName: 'Home Email',
      description: 'Home email address (max 319 characters)',
      required: false
    }),
    businessEmail: Property.ShortText({
      displayName: 'Business Email',
      description: 'Business email address (max 319 characters)',
      required: false
    }),
    otherEmail: Property.ShortText({
      displayName: 'Other Email',
      description: 'Other email address (max 319 characters)',
      required: false
    }),
    homeNumber: Property.ShortText({
      displayName: 'Home Phone',
      description: 'Home phone number (max 24 characters)',
      required: false
    }),
    businessNumber: Property.ShortText({
      displayName: 'Business Phone',
      description: 'Business phone number (max 24 characters)',
      required: false
    }),
    cellularNumber: Property.ShortText({
      displayName: 'Cellular Phone',
      description: 'Cellular phone number (max 24 characters)',
      required: false
    }),
    faxNumber: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Fax number (max 24 characters)',
      required: false
    }),
    pagerNumber: Property.ShortText({
      displayName: 'Pager Number',
      description: 'Pager number (max 24 characters)',
      required: false
    }),
    loginFromHour: Property.DateTime({
      displayName: 'Login From Hour',
      description: 'Starting time when user can log in',
      required: false
    }),
    loginToHour: Property.DateTime({
      displayName: 'Login To Hour',
      description: 'Ending time when user can log in',
      required: false
    })
  },
  async run(context) {
    const authData = await getAuthToken(context.auth);

    const requestBody: any = {
      id: parseInt(context.propsValue.userId as string),
      username: context.propsValue.username,
      userType: context.propsValue.userType || 'EPVUser',
      enableUser: context.propsValue.enableUser ?? true,
      changePassOnNextLogon: context.propsValue.changePassOnNextLogon ?? true,
      passwordNeverExpires: context.propsValue.passwordNeverExpires ?? false,
      suspended: context.propsValue.suspended ?? false,
      source: 'CyberArk',
      componentUser: false,
      location: context.propsValue.location || '\\\\'
    };

    if (context.propsValue.expiryDate) {
      requestBody.expiryDate = Math.floor(new Date(context.propsValue.expiryDate).getTime() / 1000);
    }
    if (context.propsValue.loginFromHour) {
      requestBody.loginFromHour = Math.floor(new Date(context.propsValue.loginFromHour).getTime() / 1000);
    }
    if (context.propsValue.loginToHour) {
      requestBody.loginToHour = Math.floor(new Date(context.propsValue.loginToHour).getTime() / 1000);
    }
    if (context.propsValue.userActivityLogRetentionDays !== undefined) {
      requestBody.userActivityLogRetentionDays =
        context.propsValue.userActivityLogRetentionDays;
    }
    if (context.propsValue.authenticationMethod) {
      requestBody.authenticationMethod = [context.propsValue.authenticationMethod];
    }
    if (context.propsValue.allowedAuthenticationMethods) {
      requestBody.allowedAuthenticationMethods =
        context.propsValue.allowedAuthenticationMethods;
    }
    if (context.propsValue.unAuthorizedInterfaces) {
      requestBody.unAuthorizedInterfaces =
        context.propsValue.unAuthorizedInterfaces;
    }
    if (context.propsValue.distinguishedName) {
      requestBody.distinguishedName = context.propsValue.distinguishedName;
    }
    if (context.propsValue.password) {
      requestBody.password = context.propsValue.password;
    }
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    if (context.propsValue.vaultAuthorization) {
      requestBody.vaultAuthorization = context.propsValue.vaultAuthorization;
    }

    const personalDetails: any = {};
    if (context.propsValue.firstName)
      personalDetails.firstName = context.propsValue.firstName;
    if (context.propsValue.middleName)
      personalDetails.middleName = context.propsValue.middleName;
    if (context.propsValue.lastName)
      personalDetails.lastName = context.propsValue.lastName;
    if (context.propsValue.title)
      personalDetails.title = context.propsValue.title;
    if (context.propsValue.organization)
      personalDetails.organization = context.propsValue.organization;
    if (context.propsValue.department)
      personalDetails.department = context.propsValue.department;
    if (context.propsValue.profession)
      personalDetails.profession = context.propsValue.profession;
    if (context.propsValue.street)
      personalDetails.street = context.propsValue.street;
    if (context.propsValue.city) personalDetails.city = context.propsValue.city;
    if (context.propsValue.state)
      personalDetails.state = context.propsValue.state;
    if (context.propsValue.zip) personalDetails.zip = context.propsValue.zip;
    if (context.propsValue.country)
      personalDetails.country = context.propsValue.country;
    if (Object.keys(personalDetails).length > 0) {
      requestBody.personalDetails = personalDetails;
    }

    const businessAddress: any = {};
    if (context.propsValue.workStreet)
      businessAddress.workStreet = context.propsValue.workStreet;
    if (context.propsValue.workCity)
      businessAddress.workCity = context.propsValue.workCity;
    if (context.propsValue.workState)
      businessAddress.workState = context.propsValue.workState;
    if (context.propsValue.workZip)
      businessAddress.workZip = context.propsValue.workZip;
    if (context.propsValue.workCountry)
      businessAddress.workCountry = context.propsValue.workCountry;
    if (Object.keys(businessAddress).length > 0) {
      requestBody.businessAddress = businessAddress;
    }

    const internet: any = {};
    if (context.propsValue.homePage)
      internet.homePage = context.propsValue.homePage;
    if (context.propsValue.homeEmail)
      internet.homeEmail = context.propsValue.homeEmail;
    if (context.propsValue.businessEmail)
      internet.businessEmail = context.propsValue.businessEmail;
    if (context.propsValue.otherEmail)
      internet.otherEmail = context.propsValue.otherEmail;
    if (Object.keys(internet).length > 0) {
      requestBody.internet = internet;
    }

    const phones: any = {};
    if (context.propsValue.homeNumber)
      phones.homeNumber = context.propsValue.homeNumber;
    if (context.propsValue.businessNumber)
      phones.businessNumber = context.propsValue.businessNumber;
    if (context.propsValue.cellularNumber)
      phones.cellularNumber = context.propsValue.cellularNumber;
    if (context.propsValue.faxNumber)
      phones.faxNumber = context.propsValue.faxNumber;
    if (context.propsValue.pagerNumber)
      phones.pagerNumber = context.propsValue.pagerNumber;
    if (Object.keys(phones).length > 0) {
      requestBody.phones = phones;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${authData.serverUrl}/PasswordVault/API/Users/${context.propsValue.userId}/`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authData.token
        },
        body: requestBody
      });

      if (response.status === 200) {
        return {
          success: true,
          user: response.body
        };
      } else {
        return {
          success: false,
          error: `Failed to update user. Status: ${response.status}`,
          details: response.body
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
