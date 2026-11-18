import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { actualBudgetAuth } from './auth';
import { ActualApi, ActualAuthProps, withBudget } from './client';

export function accountDropdown(params: {
  required: boolean;
  description?: string;
  displayName?: string;
}) {
  return Property.Dropdown({
    displayName: params.displayName ?? 'Account',
    description: params.description ?? 'The account in your budget',
    required: params.required,
    auth: actualBudgetAuth,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'accounts',
        fn: async (api) =>
          (await api.getAccounts())
            .filter((a) => !a.closed)
            .map((a) => ({
              label: a.offbudget ? `${a.name} (off budget)` : a.name,
              value: a.id,
            })),
      }),
  });
}

export function categoryDropdown(params: {
  required: boolean;
  description?: string;
}) {
  return Property.Dropdown({
    displayName: 'Category',
    description: params.description ?? 'The budget category',
    required: params.required,
    auth: actualBudgetAuth,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth,
        what: 'categories',
        fn: async (api) => {
          const groups = await api.getCategoryGroups();
          return groups.flatMap((g) =>
            (g.categories ?? []).map(
              (c: { id: string; name: string; hidden?: boolean }) => ({
                label: `${g.name} › ${c.name}`,
                value: c.id,
              })
            )
          );
        },
      }),
  });
}

export function monthOptions(): DropdownOption<string>[] {
  return MONTHS.map((label, i) => ({
    label,
    value: String(i + 1).padStart(2, '0'),
  }));
}

export function yearOptions(now: Date = new Date()): DropdownOption<string>[] {
  const current = now.getFullYear();
  const options: DropdownOption<string>[] = [];
  for (let year = current + 5; year >= current - 20; year--) {
    options.push({ label: String(year), value: String(year) });
  }
  return options;
}

export const yearDropdown = Property.Dropdown({
  displayName: 'Year',
  description: 'The year of the budget you want to get',
  required: true,
  auth: actualBudgetAuth,
  refreshers: [],
  options: async () => ({ disabled: false, options: yearOptions() }),
});

async function loadOptions({
  auth,
  what,
  fn,
}: {
  auth: { props: ActualAuthProps } | undefined;
  what: string;
  fn: (api: ActualApi) => Promise<DropdownOption<string>[]>;
}): Promise<DropdownState> {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Connect your Actual Budget account first',
    };
  }
  try {
    const options = await withBudget({ auth: auth.props, fn });
    if (options.length === 0) {
      return {
        disabled: false,
        options: [],
        placeholder: `No ${what} found in this budget`,
      };
    }
    return { disabled: false, options };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: `Could not load ${what}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type DropdownState = {
  disabled: boolean;
  options: DropdownOption<string>[];
  placeholder?: string;
};
