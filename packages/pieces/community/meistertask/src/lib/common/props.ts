import { Property } from '@activepieces/pieces-framework';
import { handleDropdownError } from './constants';
import { meisterTaskApiService } from './requests';

export const projectDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const params = new URLSearchParams();
        params.append('items', String(1000));
        params.append('page', String(1));

        const response = await meisterTaskApiService.fetchProjects({
          auth,
          queryString: params.toString(),
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No projects found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load projects');
      }
    },
  });

export const taskDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const params = new URLSearchParams();
        params.append('items', String(1000));
        params.append('page', String(1));

        const response = await meisterTaskApiService.fetchTasks({
          auth,
          queryString: params.toString(),
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No tasks found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load tasks');
      }
    },
  });

export const labelDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth', 'projectId'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth, projectId }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      if (!projectId)
        return handleDropdownError('Please select a project first');

      try {
        const response = await meisterTaskApiService.fetchLabels({
          auth,
          projectId,
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No labels found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load labels');
      }
    },
  });

export const multiLabelDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth', 'projectId'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.MultiSelectDropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth, projectId }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      if (!projectId)
        return handleDropdownError('Please select a project first');

      try {
        const response = await meisterTaskApiService.fetchLabels({
          auth,
          projectId,
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No labels found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load labels');
      }
    },
  });

export const sectionDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth, projectId }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const params = new URLSearchParams();
        params.append('items', String(1000));
        params.append('page', String(1));

        const response = await meisterTaskApiService.fetchSections({
          auth,
          projectId,
          queryString: params.toString(),
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No sections found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load sections');
      }
    },
  });

export const personDropdown = ({
  displayName,
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth, projectId }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await meisterTaskApiService.fetchPersons({
          auth,
          projectId,
        });

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No persons found');
        }

        const options = data.map((item: any) => {
          return {
            label: item.name,
            value: item.id,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load persons');
      }
    },
  });
