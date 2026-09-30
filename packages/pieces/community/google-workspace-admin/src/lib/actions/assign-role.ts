import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, RoleAssignment } from '../common/client';
import { googleAdminProps } from '../common/props';

export const assignRole = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'assign_role',
  classification: 'WRITE',
  displayName: 'Assign Admin Role',
  description: 'Gives a user an admin role for the whole organization or one organizational unit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Assign a Google Workspace admin role to a user, scoped to the whole organization or a single organizational unit. A retry with the same user, role and scope fails with a conflict.',
    idempotent: false,
  },
  props: {
    user: googleAdminProps.user({ required: true }),
    role: googleAdminProps.role({ required: true }),
    scopeType: Property.StaticDropdown({
      displayName: 'Scope',
      required: true,
      defaultValue: 'CUSTOMER',
      options: {
        options: [
          { label: 'Whole organization', value: 'CUSTOMER' },
          { label: 'One organizational unit', value: 'ORG_UNIT' },
        ],
      },
    }),
    orgUnitId: googleAdminProps.orgUnit({
      valueField: 'orgUnitId',
      required: false,
      description: 'Required when Scope is "One organizational unit".',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.scopeType === 'ORG_UNIT' && !propsValue.orgUnitId) {
      throw new Error('Pick an organizational unit when Scope is "One organizational unit".');
    }
    const assignedTo = await googleAdminClient.getUserId({ auth, userKey: propsValue.user });
    return googleAdminClient.request<RoleAssignment>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/customer/my_customer/roleassignments`,
      body: googleAdminClient.compact({
        roleId: propsValue.role,
        assignedTo,
        scopeType: propsValue.scopeType,
        orgUnitId: propsValue.scopeType === 'ORG_UNIT' ? propsValue.orgUnitId?.replace(/^id:/, '') : undefined,
      }),
    });
  },
});
