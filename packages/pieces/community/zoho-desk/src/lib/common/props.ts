import { DropdownState, Property } from '@activepieces/pieces-framework';
import { zohoDeskAuth } from '../auth';
import { zohoDeskApi } from './api';

function orgId<R extends boolean>({ required, displayName = 'Organization', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: zohoDeskAuth,
    displayName,
    description,
    refreshers: [],
    required,
    options: async ({ auth }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      const organizations = await zohoDeskApi.listOrganizations({ auth });
      return {
        disabled: false,
        options: organizations.map((org) => ({ label: org.companyName, value: org.id })),
      };
    },
  });
}

function departmentId<R extends boolean>({ required, displayName = 'Department', description }: PropParams<R>) {
  return Property.Dropdown({
    auth: zohoDeskAuth,
    displayName,
    description,
    refreshers: ['orgId'],
    required,
    options: async ({ auth, orgId }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      if (!orgId) {
        return disabledOptions({ placeholder: 'Please select organization first.' });
      }
      const departments = await zohoDeskApi.listDepartments({ auth, orgId: String(orgId) });
      return {
        disabled: false,
        options: departments.map((department) => ({ label: department.name, value: department.id })),
      };
    },
  });
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const zohoDeskProps = { orgId, departmentId };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
