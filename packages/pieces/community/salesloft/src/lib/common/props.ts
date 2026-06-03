import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { salesloftRequest } from './client';

interface SalesloftPerson {
  id?: number;
  email_address?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
}

interface SalesloftCadence {
  id?: number;
  name?: string;
}

interface SalesloftUser {
  id?: number;
  name?: string;
  email?: string;
}

interface SalesloftAccount {
  id?: number;
  name?: string;
  domain?: string;
}

export const personIdProp = Property.Dropdown({
  displayName: 'Person',
  required: true,
  refreshers: [],
  auth: salesloftAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Salesloft account first.',
        options: [],
      };
    }

    const response = await salesloftRequest<{ data: SalesloftPerson[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/people',
      queryParams: { per_page: '100' },
    });

    const people = response.data ?? [];

    return {
      disabled: false,
      options: people
        .filter((p) => p.id)
        .map((p) => ({
          label:
            p.email_address ??
            p.display_name ??
            (`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || String(p.id!)),
          value: String(p.id!),
        })),
    };
  },
});

export const cadenceIdProp = Property.Dropdown({
  displayName: 'Cadence',
  required: true,
  refreshers: [],
  auth: salesloftAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Salesloft account first.',
        options: [],
      };
    }

    const response = await salesloftRequest<{ data: SalesloftCadence[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/cadences',
      queryParams: { per_page: '100' },
    });

    const cadences = response.data ?? [];

    return {
      disabled: false,
      options: cadences
        .filter((c) => c.id)
        .map((c) => ({
          label: c.name ?? String(c.id),
          value: String(c.id!),
        })),
    };
  },
});

export const userIdProp = Property.Dropdown({
  displayName: 'User (Owner)',
  description:
    'Salesloft user who will own this resource. Defaults to the authenticated user if not provided.',
  required: false,
  refreshers: [],
  auth: salesloftAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Salesloft account first.',
        options: [],
      };
    }

    const response = await salesloftRequest<{ data: SalesloftUser[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/users',
      queryParams: { per_page: '100' },
    });

    const users = response.data ?? [];

    return {
      disabled: false,
      options: users
        .filter((u) => u.id)
        .map((u) => ({
          label: u.name ?? u.email ?? String(u.id),
          value: String(u.id!),
        })),
    };
  },
});

export const accountIdProp = Property.Dropdown({
  displayName: 'Account',
  description: 'Salesloft account to associate with this person.',
  required: false,
  refreshers: [],
  auth: salesloftAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Salesloft account first.',
        options: [],
      };
    }

    const response = await salesloftRequest<{ data: SalesloftAccount[] }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/accounts',
      queryParams: { per_page: '100' },
    });

    const accounts = response.data ?? [];

    return {
      disabled: false,
      options: accounts
        .filter((a) => a.id)
        .map((a) => ({
          label: a.name ?? a.domain ?? String(a.id),
          value: String(a.id!),
        })),
    };
  },
});
