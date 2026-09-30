import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, OrgUnit } from '../common/client';
import { googleAdminProps } from '../common/props';

export const listOrgUnits = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'list_org_units',
  classification: 'SEARCH',
  displayName: 'List Organizational Units',
  description: 'Lists organizational units, optionally below a given unit.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Google Workspace organizational units, either all descendants or only direct children of a parent unit. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    parentOrgUnitPath: googleAdminProps.orgUnit({
      displayName: 'Parent Organizational Unit',
      description: 'Leave empty to start from the top level.',
      valueField: 'orgUnitPath',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Include',
      required: true,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All nested units', value: 'all' },
          { label: 'Direct children only', value: 'children' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await googleAdminClient.request<{ organizationUnits?: OrgUnit[] }>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/customer/my_customer/orgunits`,
      queryParams: { orgUnitPath: propsValue.parentOrgUnitPath, type: propsValue.type },
    });
    return response.organizationUnits ?? [];
  },
});
