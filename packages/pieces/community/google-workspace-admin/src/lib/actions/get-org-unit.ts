import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, OrgUnit } from '../common/client';
import { googleAdminProps } from '../common/props';

export const getOrgUnit = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'get_org_unit',
  classification: 'READ',
  displayName: 'Get Organizational Unit',
  description: 'Gets the details of an organizational unit.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetch one Google Workspace organizational unit by its ID. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    orgUnit: googleAdminProps.orgUnit({ valueField: 'orgUnitId', required: true }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<OrgUnit>({
      auth,
      method: HttpMethod.GET,
      url: `${DIRECTORY_URL}/customer/my_customer/orgunits/${propsValue.orgUnit}`,
    });
  },
});
