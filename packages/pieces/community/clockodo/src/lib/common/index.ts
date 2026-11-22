import { PiecePropValueSchema, Property, Store } from '@activepieces/pieces-framework';
import { ClockodoClient } from './client';
import { clockodoAuth } from '../auth';
import { isNil } from '@activepieces/pieces-framework';
import { clockodoRequests } from './requests';

type ClockodoAuthValue = PiecePropValueSchema<typeof clockodoAuth>;

export function makeClient(auth: ClockodoAuthValue): ClockodoClient {
  return new ClockodoClient({
    email: auth.email,
    token: auth.token,
    clientName: auth.company_name,
    clientEmail: auth.company_email,
  });
}

async function loadOptions({
  auth,
  label,
  load,
}: {
  auth: { props: ClockodoAuthValue } | undefined;
  label: string;
  load: (client: ClockodoClient) => Promise<{ label: string; value: number }[]>;
}): Promise<DropdownState> {
  if (isNil(auth)) {
    return {
      disabled: true,
      placeholder: 'setup authentication first',
      options: [],
    };
  }
  try {
    const options = await load(makeClient(auth.props));
    return { disabled: false, options };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      disabled: true,
      placeholder: `Could not load ${label}: ${reason}`,
      options: [],
    };
  }
}

export const clockodoCommon = {
  absenceType: (required = true) =>
    Property.StaticDropdown<number, boolean>({
      displayName: 'Type',
      description: 'Kind of absence, for example regular holiday, sick day or home office.',
      required,
      options: {
        options: ABSENCE_TYPE_OPTIONS.map((o) => ({ value: Number(o.value), label: o.label })),
      },
    }),
  customer_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown<number, boolean, typeof clockodoAuth>({
      auth: clockodoAuth,
      description: 'The ID of the customer',
      displayName: 'Customer',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth,
          label: 'customers',
          load: async (client) => {
            const customers = await client.listAllCustomers({
              active: active === null ? undefined : active,
            });
            return customers.map((c) => ({ label: c.name, value: c.id }));
          },
        }),
    }),
  project_id: (
    required = true,
    requiresCustomer = true,
    active: boolean | null = true
  ) =>
    Property.Dropdown<number, boolean, typeof clockodoAuth>({
      auth: clockodoAuth,
      description: 'The ID of the project',
      displayName: 'Project',
      required,
      refreshers: requiresCustomer ? ['customer_id'] : [],
      options: async ({ auth, customer_id }) => {
        if (requiresCustomer && !isNil(auth) && isNil(customer_id)) {
          return {
            disabled: true,
            placeholder: 'select a customer first',
            options: [],
          };
        }
        return loadOptions({
          auth,
          label: 'projects',
          load: async (client) => {
            const projects = await client.listAllProjects({
              active: active === null ? undefined : active,
              customers_id: requiresCustomer
                ? clockodoRequests.parseId({ value: customer_id, field: 'Customer' })
                : undefined,
            });
            return projects.map((p) => ({ label: p.name, value: p.id }));
          },
        });
      },
    }),
  user_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown<number, boolean, typeof clockodoAuth>({
      auth: clockodoAuth,
      description: 'The ID of the user',
      displayName: 'User',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth,
          label: 'users',
          load: async (client) => {
            const users = await client.listUsers();
            return users
              .filter((u) => active === null || u.active === active)
              .map((u) => ({ label: u.name, value: u.id }));
          },
        }),
    }),
  team_id: (required = true) =>
    Property.Dropdown<number, boolean, typeof clockodoAuth>({
      auth: clockodoAuth,
      description: 'The ID of the team',
      displayName: 'Team',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth,
          label: 'teams',
          load: async (client) => {
            const teams = await client.listTeams();
            return teams.map((t) => ({ label: t.name, value: t.id }));
          },
        }),
    }),
  service_id: (required = true, active: boolean | null = true) =>
    Property.Dropdown<number, boolean, typeof clockodoAuth>({
      auth: clockodoAuth,
      description: 'The ID of the service',
      displayName: 'Service',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth,
          label: 'services',
          load: async (client) => {
            const services = await client.listServices();
            return services
              .filter((s) => active === null || s.active === active)
              .map((s) => ({ label: s.name, value: s.id }));
          },
        }),
    }),
  keepYesNo: ({ displayName, description }: { displayName: string; description: string }) =>
    Property.StaticDropdown<string, false>({
      displayName,
      description,
      required: false,
      options: {
        options: [
          { label: 'Keep', value: 'keep' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  language: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Language',
      description: 'Interface language of the user in Clockodo.',
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
    Property.StaticDropdown<number, boolean>({
      displayName: 'Color',
      description: 'Display color of the customer in Clockodo.',
      required,
      options: {
        options: COLOR_OPTIONS.map((o) => ({ label: o.label, value: o.index })),
      },
    }),
};

export function emptyToNull(val?: string | null): undefined | string | null {
  if (val === undefined || val === null) {
    return undefined;
  }
  return val || null;
}

export function currentYear(): number {
  return new Date().getUTCFullYear();
}

export function reformatDateTime(s?: string | null): string | undefined {
  if (!s) return undefined;
  return clockodoRequests.toClockodoDateTime({ value: s, field: 'Date/time' });
}

export function reformatDate(s?: string | null): string | undefined {
  if (!s) return undefined;
  return s.split('T', 2)[0];
}

export function normalizeColor(value: number | null | undefined): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const match = COLOR_OPTIONS.find((o) => o.index === value || o.hex === value);
  if (!match) {
    throw new Error(`Color must be one of the listed colors (Clockodo index 1-9), got ${value}.`);
  }
  return match.index;
}

export function deletedResult(id: number): { success: true; id: number } {
  return { success: true, id };
}

export async function pollNewById<T extends { id: number }>({
  store,
  storeKey,
  items,
}: {
  store: Store;
  storeKey: string;
  items: T[];
}): Promise<T[]> {
  const checkpoint = await store.get<number>(storeKey);
  const maxId = items.reduce((max, item) => Math.max(max, item.id), checkpoint ?? 0);
  if (checkpoint === null || checkpoint === undefined) {
    await store.put(storeKey, maxId);
    return [];
  }
  const fresh = items.filter((item) => item.id > checkpoint).sort((a, b) => a.id - b.id);
  if (maxId > checkpoint) {
    await store.put(storeKey, maxId);
  }
  return fresh;
}

export function newestFirst<T extends { id: number }>({ items, limit }: { items: T[]; limit: number }): T[] {
  return [...items].sort((a, b) => b.id - a.id).slice(0, limit);
}

type DropdownState = {
  disabled: boolean;
  placeholder?: string;
  options: { label: string; value: number }[];
};

export const ABSENCE_TYPE_OPTIONS = [
  { value: '1', label: 'Regular holiday' },
  { value: '2', label: 'Special leaves' },
  { value: '3', label: 'Reduction of overtime' },
  { value: '4', label: 'Sick day' },
  { value: '5', label: 'Sick day of a child' },
  { value: '6', label: 'School / further education' },
  { value: '7', label: 'Maternity protection' },
  { value: '8', label: 'Home office (planned hours are applied)' },
  { value: '9', label: 'Work out of office (planned hours are applied)' },
  { value: '10', label: 'Special leaves (unpaid)' },
  { value: '11', label: 'Sick day (unpaid)' },
  { value: '12', label: 'Sick day of child (unpaid)' },
  { value: '13', label: 'Quarantine' },
  { value: '14', label: 'Military / alternative service (only full days)' },
  { value: '15', label: 'Sick day (sickness benefit)' },
];

export const COLOR_OPTIONS = [
  { index: 1, name: 'orange', label: 'Orange', hex: 0xee9163 },
  { index: 2, name: 'yellow', label: 'Yellow', hex: 0xf0d758 },
  { index: 3, name: 'green', label: 'Green', hex: 0x9de34a },
  { index: 4, name: 'turquoise', label: 'Turquoise', hex: 0x39e6ca },
  { index: 5, name: 'light_blue', label: 'Light Blue', hex: 0x56c6f9 },
  { index: 6, name: 'blue', label: 'Blue', hex: 0x3657f7 },
  { index: 7, name: 'purple', label: 'Purple', hex: 0x7b4be7 },
  { index: 8, name: 'magenta', label: 'Magenta', hex: 0xd065e6 },
  { index: 9, name: 'pink', label: 'Pink', hex: 0xfc71d1 },
];
