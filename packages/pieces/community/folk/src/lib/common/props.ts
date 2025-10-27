import { Property } from '@activepieces/pieces-framework';
import { FolkAuthType } from './auth';
import { folkClient } from './client';

export const folkProps = {
  group_id: (required = false, displayName = 'Group') =>
    Property.Dropdown({
      displayName,
      description: 'Select a group from your Folk workspace. Groups help you organize your contacts.',
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
          const response = await folkClient.getGroups({ apiKey: auth as FolkAuthType });
          const groups = response.groups || [];
          
          return {
            disabled: false,
            placeholder: groups.length === 0 ? 'No groups found in your workspace' : 'Select a group',
            options: groups.map((group: any) => ({
              label: group.name || `Group ${group.id}`,
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
          const offset = 0;
          const response = await folkClient.getCompanies({ apiKey: auth as FolkAuthType, limit, offset });
          const companies = response.companies || [];
          
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
          const offset = 0;
          const response = await folkClient.getPeople({ apiKey: auth as FolkAuthType, limit, offset });
          const people = response.people || [];
          
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

