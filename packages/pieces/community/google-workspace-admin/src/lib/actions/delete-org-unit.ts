import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient } from '../common/client';
import { googleAdminProps } from '../common/props';

export const deleteOrgUnit = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'delete_org_unit',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Organizational Unit',
  description: 'Deletes an empty organizational unit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a Google Workspace organizational unit. It must contain no users, devices or child units, otherwise Google rejects the request. A retry after success fails because the unit no longer exists.',
    idempotent: false,
  },
  props: {
    orgUnit: googleAdminProps.orgUnit({ valueField: 'orgUnitId', required: true }),
  },
  async run({ auth, propsValue }) {
    await googleAdminClient.request({
      auth,
      method: HttpMethod.DELETE,
      url: `${DIRECTORY_URL}/customer/my_customer/orgunits/${propsValue.orgUnit}`,
    });
    return { success: true, org_unit_id: propsValue.orgUnit };
  },
});
