import { Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { Account, Plan } from 'recurly';
import { recurlyAuth } from '../auth';
import { listAccounts, listPlans } from './client';

export function accountCodeDropdown(required: boolean, description: string) {
  return Property.Dropdown({
    displayName: 'Account',
    description,
    required,
    refreshers: [],
    auth: recurlyAuth,
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Recurly account first.',
        };
      }

      const { data: accounts, error } = await tryCatch(() => listAccounts(auth));

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load accounts. Check your connection.',
        };
      }

      const filteredAccounts = filterAccounts(
        accounts,
        normalizeSearchValue(searchValue),
      );

      if (filteredAccounts.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No accounts found. Create one in Recurly first.',
        };
      }

      return {
        disabled: false,
        options: filteredAccounts.map((account) => ({
          label: buildAccountLabel(account),
          value: account.code ?? '',
        })).filter((option) => option.value.length > 0),
      };
    },
  });
}

export function planCodeDropdown(required: boolean, description: string) {
  return Property.Dropdown({
    displayName: 'Plan',
    description,
    required,
    refreshers: ['auth'],
    auth: recurlyAuth,
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Recurly account first.',
        };
      }

      const { data: plans, error } = await tryCatch(() => listPlans(auth));

      if (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load plans. Check your connection.',
        };
      }

      const filteredPlans = filterPlans(
        plans,
        normalizeSearchValue(searchValue),
      );

      if (filteredPlans.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No plans found. Create one in Recurly first.',
        };
      }

      return {
        disabled: false,
        options: filteredPlans.map((plan) => ({
          label: buildPlanLabel(plan),
          value: plan.code ?? '',
        })).filter((option) => option.value.length > 0),
      };
    },
  });
}

function normalizeSearchValue(searchValue: unknown): string | undefined {
  return typeof searchValue === 'string' ? searchValue : undefined;
}

function filterAccounts(accounts: Account[], searchValue: string | undefined): Account[] {
  const normalizedSearchValue = searchValue?.trim().toLowerCase();

  if (!normalizedSearchValue) {
    return accounts;
  }

  return accounts.filter((account) => buildAccountLabel(account).toLowerCase().includes(normalizedSearchValue));
}

function filterPlans(plans: Plan[], searchValue: string | undefined): Plan[] {
  const normalizedSearchValue = searchValue?.trim().toLowerCase();

  if (!normalizedSearchValue) {
    return plans;
  }

  return plans.filter((plan) => buildPlanLabel(plan).toLowerCase().includes(normalizedSearchValue));
}

function buildAccountLabel(account: Account): string {
  const accountCode = account.code ?? 'No code';
  const accountEmail = account.email ?? 'No email';
  const accountName = [account.firstName, account.lastName]
    .filter((value) => value)
    .join(' ')
    .trim();

  if (accountName) {
    return `${accountName} (${accountCode}, ${accountEmail})`;
  }

  return `${accountCode} (${accountEmail})`;
}

function buildPlanLabel(plan: Plan): string {
  return `${plan.name ?? 'Unnamed plan'} (${plan.code ?? 'No code'})`;
}
