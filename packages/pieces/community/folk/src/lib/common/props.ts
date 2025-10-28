import { Property } from '@activepieces/pieces-framework';
import { FolkAuthType } from './auth';
import { folkClient } from './client';

export const folkProps = {
  group_id: (required = false, displayName = 'Group ID') =>
    Property.ShortText({
      displayName,
      description: 'Enter a Folk group ID (e.g., grp_abc123). Groups help you organize your contacts.',
      required,
    }),

  company_id: (required = false) =>
    Property.Dropdown({
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
          const response = await folkClient.getCompaniesWithFilters({ apiKey: auth as FolkAuthType, limit });
          const companies = response.data?.items || [];
          
          return {
            disabled: false,
            placeholder: companies.length === 0 ? 'No companies found' : 'Select a company',
            options: companies.slice(0, 100).map((company: any) => {
              const emails = company.emails?.map((e: any) => e.email).filter(Boolean).join(', ');
              const label = emails ? `${company.name} (${emails})` : company.name || `Company ${company.id}`;
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

  person_id: (required = false) =>
    Property.Dropdown({
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
          const response = await folkClient.getPeopleWithFilters({ apiKey: auth as FolkAuthType, limit });
          const people = response.data?.items || [];
          
          return {
            disabled: false,
            placeholder: people.length === 0 ? 'No people found' : 'Select a person',
            options: people.slice(0, 100).map((person: any) => {
              const name = person.fullName || person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim();
              const emails = person.emails?.map((e: any) => e.email).filter(Boolean).join(', ');
              const label = emails ? `${name} (${emails})` : name || `Person ${person.id}`;
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

