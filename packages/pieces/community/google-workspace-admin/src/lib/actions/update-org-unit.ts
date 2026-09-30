import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, OrgUnit } from '../common/client';
import { googleAdminProps } from '../common/props';

export const updateOrgUnit = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'update_org_unit',
  classification: 'WRITE',
  displayName: 'Update Organizational Unit',
  description: 'Renames, moves or re-describes an organizational unit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Rename, change the description of, or move an organizational unit under a new parent; only filled fields change. Safe to retry.',
    idempotent: true,
  },
  props: {
    orgUnit: googleAdminProps.orgUnit({ valueField: 'orgUnitId', required: true }),
    name: Property.ShortText({ displayName: 'New Name', required: false }),
    parentOrgUnitPath: googleAdminProps.orgUnit({
      displayName: 'New Parent Organizational Unit',
      valueField: 'orgUnitPath',
      includeRoot: true,
      required: false,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<OrgUnit>({
      auth,
      method: HttpMethod.PATCH,
      url: `${DIRECTORY_URL}/customer/my_customer/orgunits/${propsValue.orgUnit}`,
      body: googleAdminClient.compact({
        name: propsValue.name,
        parentOrgUnitPath: propsValue.parentOrgUnitPath,
        description: propsValue.description,
      }),
    });
  },
});
