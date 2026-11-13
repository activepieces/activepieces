import { Property } from '@activepieces/pieces-framework';
import { folkAuth } from './auth';
import { folkClient, FolkAuthValue } from './client';

export const folkProps = {
  group_id: (required = false, displayName = 'Group') =>
    Property.Dropdown({
      auth: folkAuth,
      displayName,
      description: 'Pick a Folk group. Groups organize your contacts.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account to see groups.', options: [] };
        }
        try {
          const { items, truncated } = await folkClient.listForDropdown<FolkGroup>({ auth, path: '/v1/groups' });
          return {
            disabled: false,
            placeholder: placeholderFor({ count: items.length, truncated, noun: 'groups', verb: 'Select a group' }),
            options: items.map((group) => ({ label: group.name, value: group.id })),
          };
        } catch {
          return { disabled: true, placeholder: 'Could not load groups. Check the API key in the connection.', options: [] };
        }
      },
    }),

  company_id: (required = false) =>
    Property.Dropdown({
      auth: folkAuth,
      displayName: 'Company',
      description: 'Pick a company from your Folk workspace. Type to search by name.',
      required,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account to see companies.', options: [] };
        }
        try {
          const page = await searchCompanies({ auth, searchValue });
          return {
            disabled: false,
            placeholder: page.items.length === 0 ? 'No companies found' : 'Select a company (type to search)',
            options: page.items.map((company) => ({ label: companyLabel({ company }), value: company.id })),
          };
        } catch {
          return { disabled: true, placeholder: 'Could not load companies. Check the API key in the connection.', options: [] };
        }
      },
    }),

  companyIds: (required = false) =>
    Property.MultiSelectDropdown({
      auth: folkAuth,
      displayName: 'Companies',
      description: 'Pick companies to associate with the person. Type to search by name.',
      required,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account to see companies.', options: [] };
        }
        try {
          const page = await searchCompanies({ auth, searchValue });
          return {
            disabled: false,
            placeholder: page.items.length === 0 ? 'No companies found' : 'Select companies (type to search)',
            options: page.items.map((company) => ({ label: company.name || company.id, value: company.id })),
          };
        } catch {
          return { disabled: true, placeholder: 'Could not load companies. Check the API key in the connection.', options: [] };
        }
      },
    }),

  person_id: (required = false) =>
    Property.Dropdown({
      auth: folkAuth,
      displayName: 'Person',
      description: 'Pick a person from your Folk workspace. Type to search by name.',
      required,
      refreshers: [],
      refreshOnSearch: true,
      options: async ({ auth }, { searchValue }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account to see people.', options: [] };
        }
        try {
          const query: Record<string, string> = {};
          const term = searchValue?.trim();
          if (term) {
            query['filter[fullName][like]'] = term;
          }
          const page = await folkClient.listPage<FolkPersonSummary>({ auth, path: '/v1/people', query, limit: 100 });
          return {
            disabled: false,
            placeholder: page.items.length === 0 ? 'No people found' : 'Select a person (type to search)',
            options: page.items.map((person) => ({ label: personLabel({ person }), value: person.id })),
          };
        } catch {
          return { disabled: true, placeholder: 'Could not load people. Check the API key in the connection.', options: [] };
        }
      },
    }),
};

function searchCompanies({ auth, searchValue }: { auth: FolkAuthValue; searchValue?: string }) {
  const query: Record<string, string> = {};
  const term = searchValue?.trim();
  if (term) {
    query['filter[name][like]'] = term;
  }
  return folkClient.listPage<FolkCompanySummary>({ auth, path: '/v1/companies', query, limit: 100 });
}

function placeholderFor({ count, truncated, noun, verb }: { count: number; truncated: boolean; noun: string; verb: string }): string {
  if (count === 0) {
    return `No ${noun} found`;
  }
  return truncated ? `${verb} (showing the first ${count} ${noun})` : verb;
}

function companyLabel({ company }: { company: FolkCompanySummary }): string {
  const emails = (company.emails ?? []).filter((email) => typeof email === 'string' && email.length > 0).join(', ');
  const name = company.name || `Company ${company.id}`;
  return emails ? `${name} (${emails})` : name;
}

function personLabel({ person }: { person: FolkPersonSummary }): string {
  const name = person.fullName || `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  const emails = (person.emails ?? []).filter((email) => typeof email === 'string' && email.length > 0).join(', ');
  if (!name) {
    return emails || `Person ${person.id}`;
  }
  return emails ? `${name} (${emails})` : name;
}

type FolkGroup = { id: string; name: string };
type FolkCompanySummary = { id: string; name?: string; emails?: unknown[] };
type FolkPersonSummary = { id: string; fullName?: string; firstName?: string; lastName?: string; emails?: unknown[] };
