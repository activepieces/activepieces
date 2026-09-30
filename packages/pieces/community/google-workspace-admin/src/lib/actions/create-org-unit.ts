import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleWorkspaceAdminAuth } from '../auth';
import { DIRECTORY_URL, googleAdminClient, OrgUnit } from '../common/client';
import { googleAdminProps } from '../common/props';

export const createOrgUnit = createAction({
  auth: googleWorkspaceAdminAuth,
  name: 'create_org_unit',
  classification: 'WRITE',
  displayName: 'Create Organizational Unit',
  description: 'Creates a new organizational unit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a Google Workspace organizational unit under a parent unit. A retry with the same name under the same parent fails with a conflict.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'e.g. EMEA Sales', required: true }),
    parentOrgUnitPath: googleAdminProps.orgUnit({
      displayName: 'Parent Organizational Unit',
      valueField: 'orgUnitPath',
      includeRoot: true,
      required: true,
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    return googleAdminClient.request<OrgUnit>({
      auth,
      method: HttpMethod.POST,
      url: `${DIRECTORY_URL}/customer/my_customer/orgunits`,
      body: googleAdminClient.compact({
        name: propsValue.name,
        parentOrgUnitPath: propsValue.parentOrgUnitPath,
        description: propsValue.description,
      }),
    });
  },
});
