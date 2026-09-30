import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, DirectoryUser, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const updateUser = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'update_user',
  classification: 'WRITE',
  displayName: 'Update User',
  description: "Updates a user's name, email, password, organizational unit or recovery details.",
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Google Workspace user; only the fields you fill are changed. Use Suspend User / Make User Admin for status changes. Safe to retry.',
    idempotent: true,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    primaryEmail: Property.ShortText({
      displayName: 'New Primary Email',
      description: "Renames the account. The old address becomes an alias automatically.",
      required: false,
    }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    password: Property.ShortText({
      displayName: 'New Password',
      description: 'New password, 8 to 100 characters.',
      required: false,
    }),
    changePasswordAtNextLogin: Property.Checkbox({
      displayName: 'Require Password Change at Next Sign-In',
      required: false,
    }),
    orgUnitPath: googleAdminProps.orgUnit({
      valueField: 'orgUnitPath',
      includeRoot: true,
      required: false,
      description: 'Move the user to this organizational unit.',
    }),
    recoveryEmail: Property.ShortText({ displayName: 'Recovery Email', required: false }),
    recoveryPhone: Property.ShortText({
      displayName: 'Recovery Phone',
      description: 'Phone number in E.164 format, e.g. +14155552671.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const name = googleAdminClient.compact({
      givenName: propsValue.firstName,
      familyName: propsValue.lastName,
    });
    const user = await googleAdminClient.request<DirectoryUser>({
      auth,
      method: HttpMethod.PATCH,
      url: `${DIRECTORY_URL}/users/${encodeURIComponent(propsValue.user)}`,
      body: googleAdminClient.compact({
        primaryEmail: propsValue.primaryEmail,
        name: Object.keys(name).length > 0 ? name : undefined,
        password: propsValue.password,
        changePasswordAtNextLogin: propsValue.changePasswordAtNextLogin,
        orgUnitPath: propsValue.orgUnitPath,
        recoveryEmail: propsValue.recoveryEmail,
        recoveryPhone: propsValue.recoveryPhone,
      }),
    });
    return googleAdminClient.flattenUser(user);
  },
});
