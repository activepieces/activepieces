import { Property } from '@activepieces/pieces-framework';
import { OutsetaClient } from './client';
import { outsetaAuth } from '../auth';

type AuthProps = {
  props?: { domain: string; apiKey: string; apiSecret: string };
};

export function makeClient(auth: unknown): OutsetaClient | null {
  const a = auth as AuthProps;
  if (!a?.props?.domain) return null;
  return new OutsetaClient({
    domain: a.props.domain,
    apiKey: a.props.apiKey,
    apiSecret: a.props.apiSecret,
  });
}

export function accountUidDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Account',
    description: options?.description ?? 'Select the account.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/crm/accounts?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((a: any) => ({
            label: a.Name ?? a.Uid,
            value: a.Uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load accounts.',
        };
      }
    },
  });
}

export function personUidDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Person',
    description: options?.description ?? 'Select the person.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/crm/people?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((p: any) => {
            return {
              label: `${p.Email ?? p.Uid}`,
              value: p.Uid,
            };
          }),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load people.',
        };
      }
    },
  });
}

export function dealUidDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Deal',
    description: options?.description ?? 'Select the deal.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/crm/deals?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((d: any) => ({
            label: d.Name ?? d.Uid,
            value: d.Uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load deals.',
        };
      }
    },
  });
}

export function planUidDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Plan',
    description: options?.description ?? 'Select the subscription plan.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/billing/plans?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((p: any) => ({
            label: p.Name ?? p.Uid,
            value: p.Uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load plans.',
        };
      }
    },
  });
}



export function addOnUidDropdown(options?: { required?: boolean }) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: 'Add-On',
    description:
      'Select the metered add-on. Manage add-ons in Outseta → Billing → Add-ons.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/billing/addons?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((a: any) => ({
            label: a.Name ?? a.Uid,
            value: a.Uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load add-ons.',
        };
      }
    },
  });
}

export function emailListUidDropdown(options?: { required?: boolean }) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: 'Email List',
    description: 'Select the email list to subscribe to.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Outseta account first.',
        };
      }
      try {
        const res = await client.get<any>('/api/v1/email/lists?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((l: any) => ({
            label: l.Name ?? l.Uid,
            value: l.Uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load email lists.',
        };
      }
    },
  });
}
