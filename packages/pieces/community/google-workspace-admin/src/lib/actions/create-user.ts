import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryUser, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const createUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'create_user',
  classification: 'WRITE',
  displayName: 'Create User',
  description: 'Creates a new user account in your Google Workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Google Workspace user account with a primary email, name and initial password. Use Update User to change an existing account. Each call creates a new account, so a retry with the same email fails with a conflict.',
    idempotent: false,
  },
  props: {
    primaryEmail: Property.ShortText({
      displayName: 'Primary Email',
      description: 'The new account email. Must use one of your verified domains, e.g. jane.doe@yourcompany.com.',
      required: true,
    }),
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Initial password, 8 to 100 characters.',
      required: true,
    }),
    changePasswordAtNextLogin: Property.Checkbox({
      displayName: 'Require Password Change at Next Sign-In',
      required: false,
      defaultValue: true,
    }),
    orgUnitPath: googleAdminProps.orgUnit({
      valueField: 'orgUnitPath',
      includeRoot: true,
      required: false,
      description: 'Where to place the user. Leave empty for the top-level organizational unit.',
    }),
    recoveryEmail: Property.ShortText({
      displayName: 'Recovery Email',
      description: 'Personal email used for account recovery, e.g. jane@gmail.com.',
      required: false,
    }),
    recoveryPhone: Property.ShortText({
      displayName: 'Recovery Phone',
      description: 'Phone number in E.164 format, e.g. +14155552671.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const user = await googleAdminClient.request<DirectoryUser>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/users`,
      body: googleAdminClient.compact({
        primaryEmail: propsValue.primaryEmail,
        name: { givenName: propsValue.firstName, familyName: propsValue.lastName },
        password: propsValue.password,
        changePasswordAtNextLogin: propsValue.changePasswordAtNextLogin ?? true,
        orgUnitPath: propsValue.orgUnitPath,
        recoveryEmail: propsValue.recoveryEmail,
        recoveryPhone: propsValue.recoveryPhone,
      }),
    });
    return googleAdminClient.flattenUser(user);
  },
});
