import { Property } from '@activepieces/pieces-framework';
import { vercelAuth } from './auth';
import { listAllProjects, toProjectDropdownOptions } from './client';

export const vercelProjectDropdown = Property.Dropdown({
  auth: vercelAuth,
  displayName: 'Project',
  description: 'Select a Vercel project.',
  required: true,
  refreshers: ['auth'],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Vercel account first',
        options: [],
      };
    }

    const projects = await listAllProjects(auth, searchValue);

    return {
      disabled: false,
      options: toProjectDropdownOptions(projects),
    };
  },
});

export const deploymentTargetProperty = Property.StaticDropdown({
  displayName: 'Target',
  description: 'Vercel deployment target environment.',
  required: false,
  defaultValue: 'preview',
  options: {
    options: [
      { label: 'Preview', value: 'preview' },
      { label: 'Production', value: 'production' },
    ],
  },
});

export const envTargetsProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Target Environments',
  description: 'Environment(s) where this variable should apply.',
  required: true,
  options: {
    options: [
      { label: 'Production', value: 'production' },
      { label: 'Preview', value: 'preview' },
      { label: 'Development', value: 'development' },
    ],
  },
  defaultValue: ['production', 'preview', 'development'],
});
