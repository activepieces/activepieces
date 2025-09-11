import { Property } from '@activepieces/pieces-framework';
import { CopperApiService } from './requests';
import { CopperAuthType } from './constants';

export const peopleDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Person',
    description: 'select a person',
    required: true,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const people = await CopperApiService.fetchPeople(auth);

        return {
          options: people.map((person: any) => ({
            label: person.name,
            value: JSON.stringify(person),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch campaigns', e);
        return {
          options: [],
          placeholder: 'Unable to load campaigns',
        };
      }
    },
  });

export const leadDropdown = (refreshers: string[]) =>
  Property.Dropdown({
    displayName: 'Lead',
    description: 'select a Lead',
    required: true,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const leads = await CopperApiService.fetchLeads(auth);

        return {
          options: leads.map((lead: any) => ({
            label: lead.name,
            value: JSON.stringify(lead),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch leads', e);
        return {
          options: [],
          placeholder: 'Unable to load leads',
        };
      }
    },
  });

export const companyDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Company',
    description: 'select a Company',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const companies = await CopperApiService.fetchCompanies(auth);

        return {
          options: companies.map((company: any) => ({
            label: company.name,
            value: JSON.stringify(company),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch companies', e);
        return {
          options: [],
          placeholder: 'Unable to load companies',
        };
      }
    },
  });

export const multiCompanyDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Company',
    description: 'select Companies',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const companies = await CopperApiService.fetchCompanies(auth);

        return {
          options: companies.map((company: any) => ({
            label: company.name,
            value: company.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch companies', e);
        return {
          options: [],
          placeholder: 'Unable to load companies',
        };
      }
    },
  });

export const primaryContactsDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Primary Contact',
    description: 'select a primary contact',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const primaryContacts = await CopperApiService.fetchPeople(auth);

        return {
          options: primaryContacts.map((contact: any) => ({
            label: contact.name,
            value: contact.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const multiPrimaryContactsDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Primary Contacts',
    description: 'select primary contacts',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const primaryContacts = await CopperApiService.fetchPeople(auth);

        return {
          options: primaryContacts.map((contact: any) => ({
            label: contact.name,
            value: contact.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const usersDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Assignee',
    description: 'select a user to assign to',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const users = await CopperApiService.fetchUsers(auth);

        return {
          options: users.map((user: any) => ({
            label: user.name,
            value: user.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const multiUsersDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Assignee',
    description: 'select assignees',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const users = await CopperApiService.fetchUsers(auth);

        return {
          options: users.map((user: any) => ({
            label: user.name,
            value: user.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const opportunityDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Opportunity',
    description: 'select an Opportunity',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const opportunities = await CopperApiService.fetchOpportunities(auth);

        return {
          options: opportunities.map((opportunity: any) => ({
            label: opportunity.name,
            value: JSON.stringify(opportunity),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const multiOpportunityDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Opportunity',
    description: 'select Opportunities',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const opportunities = await CopperApiService.fetchOpportunities(auth);

        return {
          options: opportunities.map((opportunity: any) => ({
            label: opportunity.name,
            value: opportunity.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch opportunities', e);
        return {
          options: [],
          placeholder: 'Unable to load opportunities',
        };
      }
    },
  });

export const pipelinesDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Pipeline',
    description: 'select a Pipeline',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const pipelines = await CopperApiService.fetchPipelines(auth);

        return {
          options: pipelines.map((pipeline: any) => ({
            label: pipeline.name,
            value: JSON.stringify(pipeline),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch pipelines', e);
        return {
          options: [],
          placeholder: 'Unable to load pipelines',
        };
      }
    },
  });

export const multiPipelinesDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Pipeline',
    description: 'select a Pipeline',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const pipelines = await CopperApiService.fetchPipelines(auth);

        return {
          options: pipelines.map((pipeline: any) => ({
            label: pipeline.name,
            value: JSON.stringify(pipeline),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch pipelines', e);
        return {
          options: [],
          placeholder: 'Unable to load pipelines',
        };
      }
    },
  });

export const projectsDropdown = ({
  refreshers,
  required = false,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Project',
    description: 'select a Project',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const projects = await CopperApiService.fetchProjects(auth);

        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: JSON.stringify(project),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch projects', e);
        return {
          options: [],
          placeholder: 'Unable to load projects',
        };
      }
    },
  });

export const ActivityTypesDropdown = (entity?: 'user' | 'system') =>
  Property.Dropdown({
    displayName: 'Activity Type',
    description: 'Select activity Type',
    required: true,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchActivityTypes(auth);

        const items =
          entity && response[entity]
            ? response[entity]
            : [...response.user, ...response.system];

        return {
          options: items.map((item: any) => ({
            label: item.name,
            value: JSON.stringify(item),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch activity types', e);
        return {
          options: [],
          placeholder: 'Unable to load activity types',
        };
      }
    },
  });

export const MultiActivityTypesDropdown = ({
  entity,
  required = false
}: {
  entity?: 'user' | 'system';
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Activity Type',
    description: 'Select activity Type',
    required,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchActivityTypes(auth);

        const items =
          entity && response[entity]
            ? response[entity]
            : [...response.user, ...response.system];

        return {
          options: items.map((item: any) => ({
            label: item.name,
            value: JSON.stringify(item),
          })),
        };
      } catch (e) {
        console.error('Failed to fetch activity types', e);
        return {
          options: [],
          placeholder: 'Unable to load activity types',
        };
      }
    },
  });

export const MultiContactTypesDropdown = ({
  required = false
}: {
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Contact Type',
    description: 'Select contact Type',
    required,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchContactTypes(auth);

        return {
          options: response.map((item: any) => ({
            label: item.name,
            value: item.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch contact types', e);
        return {
          options: [],
          placeholder: 'Unable to load contact types',
        };
      }
    },
  });

export const MultiLeadStatusDropdown = ({
  required = false
}: {
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Lead Status',
    description: 'Select lead status',
    required,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchLeadStatuses(auth);

        return {
          options: response.map((item: any) => ({
            label: item.name,
            value: item.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch lead statuses', e);
        return {
          options: [],
          placeholder: 'Unable to load lead statuses',
        };
      }
    },
  });

export const MultiCustomerSourceDropdown = ({
  required = false
}: {
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Customer Source',
    description: 'Select customer source.',
    required,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchCustomerSources(auth);

        return {
          options: response.map((item: any) => ({
            label: item.name,
            value: item.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch customer sources', e);
        return {
          options: [],
          placeholder: 'Unable to load customer sources',
        };
      }
    },
  });

export const MultiLossReasonsDropdown = ({
  required = false
}: {
  required?: boolean;
}) =>
  Property.MultiSelectDropdown({
    displayName: 'Loss Reason',
    description: 'Select loss reason.',
    required,
    refreshers: ['auth'],
    async options(propsValue: Record<string, unknown>) {
      const auth = propsValue['auth'] as CopperAuthType | undefined;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Copper account first',
          options: [],
        };
      }

      try {
        const response = await CopperApiService.fetchLossReasons(auth);

        return {
          options: response.map((item: any) => ({
            label: item.name,
            value: item.id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch loss reasons', e);
        return {
          options: [],
          placeholder: 'Unable to load loss reasons',
        };
      }
    },
  });
