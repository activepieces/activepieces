import { Property } from '@activepieces/pieces-framework';
import { folkAuth } from './auth';
import { folkClient } from './client';

export const folkProps = {
  group_id: (required = false, displayName = 'Group ID') =>
    Property.Dropdown({
      auth: folkAuth,
      displayName,
      description:
        'Enter a Folk group ID (e.g., grp_abc123). Groups help you organize your contacts.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account to see groups.',
            options: [],
          };
        }

        try {
          const response = await folkClient.getGroups({
            apiKey: auth,
          });
          const groups = response.data?.items || [];

          return {
            disabled: false,
            placeholder:
              groups.length === 0 ? 'No groups found' : 'Select a group',
            options: groups.map((group: any) => ({
              label: group.name,
              value: group.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading groups. Check your API key.',
            options: [],
          };
        }
      },
    }),

  company_id: (required = false) =>
    Property.Dropdown({
      auth: folkAuth,
      displayName: 'Company',
      description: 'Select a company from your Folk workspace.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account to see companies.',
            options: [],
          };
        }

        try {
          const limit = 100;
          const response = await folkClient.getCompaniesWithFilters({
            apiKey: auth,
            limit,
          });
          const companies = response.data?.items || [];

          return {
            disabled: false,
            placeholder:
              companies.length === 0
                ? 'No companies found'
                : 'Select a company',
            options: companies.slice(0, 100).map((company: any) => {
              const emails = company.emails
                ?.map((e: any) => e.email)
                .filter(Boolean)
                .join(', ');
              const label = emails
                ? `${company.name} (${emails})`
                : company.name || `Company ${company.id}`;
              return {
                label,
                value: company.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading companies. Check your API key.',
            options: [],
          };
        }
      },
    }),
  companyIds: (required = false) =>
    Property.MultiSelectDropdown({
      auth: folkAuth,
      displayName: 'Companies',
      description: 'Select companies to associate with the person.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account to see companies.',
            options: [],
          };
        }

        try {
          const limit = 100;
          const response = await folkClient.getCompaniesWithFilters({
            apiKey: auth,
            limit,
          });
          const companies = response.data?.items || [];

          return {
            disabled: false,
            placeholder:
              companies.length === 0
                ? 'No companies found'
                : 'Select companies',
            options: companies.map((company: any) => ({
              label: company.name,
              value: company.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading companies. Check your API key.',
            options: [],
          };
        }
      },
    }),

  person_id: (required = false) =>
    Property.Dropdown({
      auth: folkAuth,
      displayName: 'Person',
      description: 'Select a person from your Folk workspace.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account to see people.',
            options: [],
          };
        }

        try {
          const limit = 100;
          const response = await folkClient.getPeopleWithFilters({
            apiKey: auth,
            limit,
          });
          const people = response.data?.items || [];

          return {
            disabled: false,
            placeholder:
              people.length === 0 ? 'No people found' : 'Select a person',
            options: people.slice(0, 100).map((person: any) => {
              const name =
                person.fullName ||
                person.name ||
                `${person.firstName || ''} ${person.lastName || ''}`.trim();
              const emails = person.emails
                ?.map((e: any) => e.email)
                .filter(Boolean)
                .join(', ');
              const label = emails
                ? `${name} (${emails})`
                : name || `Person ${person.id}`;
              return {
                label,
                value: person.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading people. Check your API key.',
            options: [],
          };
        }
      },
    }),
};
