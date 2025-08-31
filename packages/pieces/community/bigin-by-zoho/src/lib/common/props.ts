import { Property } from "@activepieces/pieces-framework";
import { biginApiService } from "./request";
import { handleDropdownError } from "./helpers";

export const usersDropdown = Property.Dropdown({
  displayName: 'Owner',
  description: 'Select the owner to which the record will be assigned.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth)
      return handleDropdownError('Please connect your account first');

    const { api_domain } = auth;

    try {
      const response = await biginApiService.fetchUsers(
        auth.access_token,
        api_domain
      );
      const users = Array.isArray(response?.users) ? response.users : [];
      if (users.length === 0) {
        return handleDropdownError('No users found');
      }

      const options = users.map((user: any) => {
        const fullName =
          (typeof user.full_name === 'string' && user.full_name.trim() !== ''
            ? user.full_name
            : [user.first_name, user.last_name]
                .filter((p: any) => typeof p === 'string' && p.trim() !== '')
                .join(' ')) || user.email || user.id;
        return {
          label: fullName,
          value: user.id,
        };
      });

      return {
        disabled: false,
        options,
      };
    } catch (error) {
      return handleDropdownError('Failed to load users');
    }
  },
});

export const companyDropdown = Property.Dropdown({
  displayName: 'Company',
  description:
    'The ID of the company to which the record will be associated. If not provided, the record will not be associated with any company.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchCompanies(
      auth.access_token,
      auth.api_domain
    );
    return {
      options: resp.data.map((a: any) => ({
        label: a.Account_Name,
        value: a.id,
      })),
    };
  },
});

export const contactsDropdown = Property.Dropdown({
  displayName: 'Contacts',
  description:
    'The ID of the contact to which the record will be associated. If not provided, the record will not be associated with any contact.',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchContacts(
      auth.access_token,
      auth.api_domain
    );
    return {
      options: resp.data.map((a: any) => ({
        label: a.First_Name + ' ' + a.Last_Name,
        value: a.id,
      })),
    };
  },
});

export const multiContactsDropdown = Property.MultiSelectDropdown({
  displayName: 'Secondary Contacts',
  description:
    'Provide a list of additional contacts associated with the record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchContacts(
      auth.access_token,
      auth.api_domain
    );
    return {
      options: resp.data.map((a: any) => ({
        label: a.First_Name + ' ' + a.Last_Name,
        value: a.id,
      })),
    };
  },
});

export const pipelineRecordsDropdown = Property.Dropdown({
  displayName: 'Pipeline Record',
  description:
    'Select a pipeline record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchPipelinesRecords(
      auth.access_token,
      auth.api_domain
    );
    return {
      options: resp.data.map((a: any) => ({
        label: a.Deal_Name,
        value: JSON.stringify(a),
      })),
    };
  },
});

export const layoutsDropdown = (displayName: string, description: string, module_name: string) => Property.Dropdown({
  displayName,
  description,
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchLayouts(
      auth.access_token,
      auth.api_domain,
      module_name
    );

    return {
      options: resp.layouts.map((a: any) => ({
        label: a.name,
        value: JSON.stringify(a),
      })),
    };
  },
});

export const productsDropdown = Property.MultiSelectDropdown({
  displayName: 'Associated Products',
  description:
    'Provide a list of products associated with the record',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    const resp = await biginApiService.fetchProducts(
      auth.access_token,
      auth.api_domain
    );

    if (!Array.isArray(resp.data) || resp.data.length === 0) {
      return handleDropdownError('No products found. Please add products first.');
    }

    return {
      options: resp.data.map((a: any) => ({
        label: a.Product_Name,
        value: JSON.stringify(a),
      })),
    };
  },
});

export const tagsDropdown = (module: string, defaultValue?: string[]) => Property.MultiSelectDropdown({
  displayName: 'Tags',
  description: `Select tags to associate with this module, "${module}".`,
  required: false,
  refreshers: ['auth'],
  defaultValue: defaultValue || [],
  options: async ({ auth }: any) => {
    if (!auth) return handleDropdownError('Please Connect your account first');
    try {
      const resp = await biginApiService.fetchTags(
        auth.access_token,
        auth.api_domain,
        module
      );

      const tags = Array.isArray(resp?.tags) ? resp.tags : [];
      if (tags.length === 0) {
        return handleDropdownError('No tags found. Please add tags first.');
      }

      return {
        options: tags.map((a: any) => ({
          label: a.name,
          value: a.name,
        })),
      };
    } catch (e) {
      return handleDropdownError('Failed to load tags');
    }
  },
});

export const SubPipelineorStageDropdown = (
  displayName: string,
  description: string,
  field_label: string,
  defaultValue?: string
) =>
  Property.Dropdown({
    displayName,
    description,
    required: true,
    refreshers: ['auth', 'pipeline'],
    defaultValue,
    options: async ({ auth, pipeline }) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');
      if (!pipeline)
        return handleDropdownError('Please select a Pipeline first');

      const { access_token, api_domain } = auth as any;

      const response = await biginApiService.fetchLayouts(
        access_token,
        api_domain,
        'Pipelines'
      );

      const layouts = response?.layouts || [];

      const parsedPipeline = JSON.parse(pipeline as string);

      const layout = layouts.find((l: any) => l.id === parsedPipeline.id);

      const PipelineInfo = layout.sections.find(
        (s: any) => s.api_name === 'Pipeline Information'
      );

      const stageField = PipelineInfo?.fields.find(
        (f: any) => f.field_label === field_label
      );

      return {
        options: stageField.pick_list_values.map((pl: any) => ({
          label: pl.display_value,
          value: pl.actual_value,
        })),
      };
    },
  });