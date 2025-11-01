import { DropdownProperty, Property } from '@activepieces/pieces-framework';
import { handleDropdownError } from './helpers';
import { myCaseApiService } from './requests';

export const caseDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Case',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCases(auth.access_token);

        const caseStages = Array.isArray(response) ? response : [];
        if (caseStages.length === 0) {
          return handleDropdownError('No case stages found');
        }

        const options = caseStages.map((item: any) => {
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
        return handleDropdownError('Failed to load case stages');
      }
    },
  });

export const multiCasesDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Case',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCases(auth.access_token);

        const caseStages = Array.isArray(response) ? response : [];
        if (caseStages.length === 0) {
          return handleDropdownError('No case stages found');
        }

        const options = caseStages.map((item: any) => {
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
        return handleDropdownError('Failed to load case stages');
      }
    },
  });

export const caseStageDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Case Stage',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCaseStages(
          auth.access_token
        );

        const caseStages = Array.isArray(response) ? response : [];
        if (caseStages.length === 0) {
          return handleDropdownError('No case stages found');
        }

        const options = caseStages.map((item: any) => {
          return {
            label: item.name,
            value: item.name,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load case stages');
      }
    },
  });

export const practiceAreaDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Practice Area',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchPracticeAreas(
          auth.access_token
        );

        const practiceAreas = Array.isArray(response) ? response : [];
        if (practiceAreas.length === 0) {
          return handleDropdownError('No practice areas found');
        }

        const options = practiceAreas.map((item: any) => {
          return {
            label: item.name,
            value: item.name,
          };
        });

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return handleDropdownError('Failed to load practice areas');
      }
    },
  });

export const multiClientDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Clients',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchClients(auth.access_token);

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No clients found');
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
        return handleDropdownError('Failed to load clients');
      }
    },
  });

export const clientDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Client',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchClients(auth.access_token);

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No clients found');
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
        return handleDropdownError('Failed to load clients');
      }
    },
  });

export const leadDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Lead',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchLeads(auth.access_token);

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No leads found');
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
        return handleDropdownError('Failed to load leads');
      }
    },
  });

export const multiCompanyDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Companies',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCompanies(
          auth.access_token
        );

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No companies found');
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
        return handleDropdownError('Failed to load companies');
      }
    },
  });

export const companyDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Company',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCompanies(
          auth.access_token
        );

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No companies found');
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
        return handleDropdownError('Failed to load companies');
      }
    },
  });

export const clientsAndCompaniesDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
  displayName = 'Billing Contact',
}: {
  displayName?: string;
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
        const [clients, companies] = await Promise.all([
          myCaseApiService.fetchClients(auth.access_token),
          myCaseApiService.fetchCompanies(auth.access_token),
        ]);

        const response = [...clients, ...companies];

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No clients or companies found');
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
        return handleDropdownError('Failed to load clients or companies');
      }
    },
  });

export const staffDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Staff Member',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCompanies(
          auth.access_token
        );

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No staffs found');
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
        return handleDropdownError('Failed to load staffs');
      }
    },
  });

export const multiStaffDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
  defaultValue = [],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
  defaultValue?: string[];
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Staff Member',
    description,
    required,
    refreshers,
    defaultValue,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchCompanies(
          auth.access_token
        );

        const data = Array.isArray(response) ? response : [];
        if (data.length === 0) {
          return handleDropdownError('No staffs found');
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
        return handleDropdownError('Failed to load staffs');
      }
    },
  });

export const locationDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Location',
    description,
    required,
    refreshers,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchLocations(
          auth.access_token
        );

        const locations = Array.isArray(response) ? response : [];
        if (locations.length === 0) {
          return handleDropdownError('No locations found');
        }

        const options = locations.map((item: any) => {
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
        return handleDropdownError('Failed to load locations');
      }
    },
  });

export const referralSourceDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
}) =>
  Property.Dropdown({
    displayName: 'Referral Source',
    description,
    required,
    refreshers,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchReferralSources(
          auth.access_token
        );

        const referralSources = Array.isArray(response) ? response : [];
        if (referralSources.length === 0) {
          return handleDropdownError('No referral sources found');
        }

        const options = referralSources.map((item: any) => {
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
        return handleDropdownError('Failed to load referral sources');
      }
    },
  });

export const peopleGroupDropdown = ({
  description,
  required = false,
  refreshers = ['auth'],
}: {
  description: string;
  required?: boolean;
  refreshers?: string[];
}) =>
  Property.Dropdown({
    displayName: 'People Group',
    description,
    required,
    refreshers,
    options: async ({ auth }: any) => {
      if (!auth)
        return handleDropdownError('Please connect your account first');

      try {
        const response = await myCaseApiService.fetchPeopleGroups(
          auth.access_token
        );

        const peopleGroups = Array.isArray(response) ? response : [];
        if (peopleGroups.length === 0) {
          return handleDropdownError('No people groups found');
        }

        const options = peopleGroups.map((item: any) => {
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
        return handleDropdownError('Failed to load people groups');
      }
    },
  });
