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

// --- Structural dropdowns (few items, must be complete) ---

export function pipelineDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Pipeline',
    description: options?.description ?? 'Select the deal pipeline.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
      }
      try {
        const res = await client.get<any>('/api/v1/crm/deals/pipelines?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items.map((p: any) => ({
            label: p.Name ?? p.Uid,
            value: p.Uid,
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load pipelines.' };
      }
    },
  });
}

export function pipelineStageDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Pipeline Stage',
    description: options?.description ?? 'Select the pipeline stage.',
    refreshers: ['pipelineUid'],
    required: options?.required ?? true,
    options: async ({ auth, pipelineUid }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
      }
      if (!pipelineUid) {
        return { disabled: true, options: [], placeholder: 'Select a pipeline first.' };
      }
      try {
        const pipeline = await client.get<any>(`/api/v1/crm/deals/pipelines/${pipelineUid}`);
        const stages: any[] = pipeline?.DealPipelineStages?.items
          ?? pipeline?.DealPipelineStages?.Items
          ?? pipeline?.DealPipelineStages
          ?? [];
        return {
          disabled: false,
          options: stages.map((s: any) => ({
            label: s.Name ?? s.Uid,
            value: s.Uid,
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load pipeline stages.' };
      }
    },
  });
}

export function planUidDropdown(options?: {
  required?: boolean;
  displayName?: string;
  description?: string;
  refreshers?: string[];
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: options?.displayName ?? 'Plan',
    description: options?.description ?? 'Select the subscription plan.',
    refreshers: options?.refreshers ?? ['accountUid'],
    required: options?.required ?? true,
    options: async ({ auth, accountUid }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
      }

      let planFamilyUid: string | null = null;
      if (accountUid) {
        try {
          const account = await client.get<any>(
            `/api/v1/crm/accounts/${accountUid}?fields=CurrentSubscription.Plan.PlanFamily.*`
          );
          planFamilyUid = account?.CurrentSubscription?.Plan?.PlanFamily?.Uid ?? null;
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load account. Check the Account UID.' };
        }
      }

      try {
        const res = await client.get<any>('/api/v1/billing/plans?$top=100');
        let items: any[] = res?.items ?? res?.Items ?? [];

        if (planFamilyUid) {
          items = items.filter((p: any) => p.PlanFamily?.Uid === planFamilyUid);
        }

        return {
          disabled: false,
          options: items.map((p: any) => ({
            label: p.Name ?? p.Uid,
            value: p.Uid,
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load plans.' };
      }
    },
  });
}

export function addOnUidDropdown(options?: {
  required?: boolean;
  refreshers?: string[];
}) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: 'Add-On',
    description: 'Select the metered add-on.',
    refreshers: options?.refreshers ?? ['accountUid'],
    required: options?.required ?? true,
    options: async ({ auth, accountUid }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
      }

      if (accountUid) {
        try {
          const account = await client.get<any>(
            `/api/v1/crm/accounts/${accountUid}?fields=CurrentSubscription.SubscriptionAddOns.*,CurrentSubscription.SubscriptionAddOns.AddOn.*`
          );
          const rawAddOns = account?.CurrentSubscription?.SubscriptionAddOns;
          const subscriptionAddOns: any[] = Array.isArray(rawAddOns)
            ? rawAddOns
            : (rawAddOns?.items ?? rawAddOns?.Items ?? []);
          return {
            disabled: false,
            options: subscriptionAddOns.map((sa: any) => ({
              label: sa.AddOn?.Name ?? sa.Uid,
              value: sa.AddOn?.Uid ?? sa.Uid,
            })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load account. Check the Account UID.' };
        }
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
        return { disabled: true, options: [], placeholder: 'Failed to load add-ons.' };
      }
    },
  });
}

export function emailListUidDropdown(options?: { required?: boolean }) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: 'Email List',
    description: 'Select the email list.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
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
        return { disabled: true, options: [], placeholder: 'Failed to load email lists.' };
      }
    },
  });
}

export function discountDropdown(options?: { required?: boolean }) {
  return Property.Dropdown({
    auth: outsetaAuth,
    displayName: 'Discount',
    description: 'Select the discount coupon to apply.',
    refreshers: [],
    required: options?.required ?? true,
    options: async ({ auth }) => {
      const client = makeClient(auth);
      if (!client) {
        return { disabled: true, options: [], placeholder: 'Connect your Outseta account first.' };
      }
      try {
        const res = await client.get<any>('/api/v1/billing/discountcoupons?$top=100');
        const items: any[] = res?.items ?? res?.Items ?? [];
        return {
          disabled: false,
          options: items
            .filter((d: any) => d.IsActive !== false)
            .map((d: any) => ({
              label: `${d.Name ?? d.UniqueIdentifier ?? d.Uid}${d.PercentOff ? ` (${d.PercentOff}% off)` : d.AmountOff ? ` ($${d.AmountOff} off)` : ''}`,
              value: d.Uid,
            })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Failed to load discounts.' };
      }
    },
  });
}
