import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { ClockodoClient } from './client';
import { clockodoAuth } from '../../';
import { isNil } from '@activepieces/shared';

type ClockodoAuthValue = PiecePropValueSchema<typeof clockodoAuth>;

export function makeClient(auth: ClockodoAuthValue): ClockodoClient {
  return new ClockodoClient(
    auth.email,
    auth.token,
    auth.company_name,
    auth.company_email
  );
}

export const clockodoCommon = {
  absenceType: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Type',
      required,
      options: {
        options: [
          { value: 1, label: 'Regular holiday' },
          { value: 2, label: 'Special leaves' },
          { value: 3, label: 'Reduction of overtime' },
          { value: 4, label: 'Sick day' },
          { value: 5, label: 'Sick day of a child' },
          { value: 6, label: 'School / further education' },
          { value: 7, label: 'Maternity protection' },
          { value: 8, label: 'Home office (planned hours are applied)' },
          { value: 9, label: 'Work out of office (planned hours are applied)' },
          { value: 10, label: 'Special leaves (unpaid)' },
          { value: 11, label: 'Sick day (unpaid)' },
          { value: 12, label: 'Sick day of child (unpaid)' },
          { value: 13, label: 'Quarantine' },
          {
            value: 14,
            label: 'Military / alternative service (only full days)',
          },
          { value: 15, label: 'Sick day (sickness benefit)' },
        ],
      },
    }),
  customer_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown({
      description: 'The ID of the customer',
      displayName: 'Customer',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (isNil(auth)) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient(auth as ClockodoAuthValue);
        const customers = await client.listAllCustomers({
          active: active === null ? undefined : active,
        });
        return {
          disabled: false,
          options: customers.map((customer) => {
            return {
              label: customer.name,
              value: customer.id,
            };
          }),
        };
      },
    }),
  project_id: (
    required = true,
    requiresCustomer = true,
    active: boolean | null = true
  ) =>
    Property.Dropdown({
      description: 'The ID of the project',
      displayName: 'Project',
      required,
      refreshers: [...(requiresCustomer ? ['customer_id'] : [])],
      options: async ({ auth, customer_id }) => {
        if (isNil(auth)) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        if (requiresCustomer && !customer_id) {
          return {
            disabled: true,
            placeholder: 'select a customer first',
            options: [],
          };
        }
        const client = makeClient(auth as ClockodoAuthValue);
        const projects = await client.listAllProjects({
          active: active === null ? undefined : active,
          customers_id: requiresCustomer
            ? parseInt(customer_id as string)
            : undefined,
        });
        return {
          disabled: false,
          options: projects.map((project) => {
            return {
              label: project.name,
              value: project.id,
            };
          }),
        };
      },
    }),
  user_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown({
      description: 'The ID of the user',
      displayName: 'User',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (isNil(auth)) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient(auth as ClockodoAuthValue);
        const usersRes = await client.listUsers();
        return {
          disabled: false,
          options: usersRes.users
            .filter((u) => active === null || u.active === active)
            .map((user) => {
              return {
                label: user.name,
                value: user.id,
              };
            }),
        };
      },
    }),
  team_id: (required = true) =>
    Property.Dropdown({
      description: 'The ID of the team',
      displayName: 'Team',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (isNil(auth)) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient(auth as ClockodoAuthValue);
        const teamsRes = await client.listTeams();
        return {
          disabled: false,
          options: teamsRes.teams.map((team) => {
            return {
              label: team.name,
              value: team.id,
            };
          }),
        };
      },
    }),
  service_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown({
      description: 'The ID of the service',
      displayName: 'Service',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (isNil(auth)) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient(auth as ClockodoAuthValue);
        const servicesRes = await client.listServices();
        return {
          disabled: false,
          options: servicesRes.services
            .filter((s) => active === null || s.active === active)
            .map((service) => {
              return {
                label: service.name,
                value: service.id,
              };
            }),
        };
      },
    }),
  language: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Language',
      required,
      options: {
        options: [
          { label: 'German', value: 'de' },
          { label: 'English', value: 'en' },
          { label: 'French', value: 'fr' },
        ],
      },
    }),
  color: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Color',
      required,
      options: {
        options: [
          { label: 'Orange', value: 0xee9163 },
          { label: 'Yellow', value: 0xf0d758 },
          { label: 'Green', value: 0x9de34a },
          { label: 'Caribean', value: 0x39e6ca },
          { label: 'Lightblue', value: 0x56c6f9 },
          { label: 'Blue', value: 0x3657f7 },
          { label: 'Purple', value: 0x7b4be7 },
          { label: 'Magenta', value: 0xd065e6 },
          { label: 'Pink', value: 0xfc71d1 },
        ],
      },
    }),
};

export function emptyToNull(val?: string): undefined | string | null {
  return val === undefined ? val : val || null;
}

export function currentYear(): number {
  const todaysDate = new Date();
  return todaysDate.getFullYear();
}

export function reformatDateTime(s?: string): string | undefined {
  if (!s) return undefined;
  return s.replace(/\.[0-9]{3}/, '');
}

export function reformatDate(s?: string): string | undefined {
  if (!s) return undefined;
  return s.split('T', 2)[0];
}
