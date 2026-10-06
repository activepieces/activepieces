import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { GoogleAdsApi, normalizeCustomerId } from './client';
import type { CustomerInfo, GoogleAdsAuthValue } from './client';

export async function customerOptions(auth: GoogleAdsAuthValue | undefined): Promise<DropdownState<string>> {
  if (!auth?.access_token) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please select an existing or create a new connection.',
    };
  }

  try {
    const loginCustomerId = auth.props?.loginCustomerId?.trim();
    if (loginCustomerId) {
      const clients = await GoogleAdsApi.listCustomerClients({ auth, managerId: normalizeCustomerId(loginCustomerId) });
      if (clients.length === 0) {
        return { disabled: true, options: [], placeholder: 'The manager account has no enabled client accounts.' };
      }
      return { disabled: false, options: clients.map((c) => ({ label: labelFor(c), value: c.id })) };
    }

    const ids = await GoogleAdsApi.listAccessibleCustomers(auth);
    if (ids.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'This Google account has no accessible Google Ads customers.',
      };
    }

    const lookups = await Promise.allSettled(
      ids.slice(0, MAX_LABEL_LOOKUPS).map((customerId) => GoogleAdsApi.customerInfo({ auth, customerId }))
    );
    const options = ids
      .map((id, index) => {
        const lookup = lookups[index];
        const info: CustomerInfo = lookup?.status === 'fulfilled' ? { ...lookup.value, id } : { id };
        return { label: labelFor(info), value: id };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return { disabled: false, options };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      disabled: true,
      options: [],
      placeholder: `An error occurred while listing the accessible Google Ads customers: ${detail.slice(0, 300)}`,
    };
  }
}

export const customerIdProp = Property.Dropdown<string, true, typeof googleAdsAuth>({
  displayName: 'Customer',
  description: 'Google Ads account to operate on. Accounts reached through a manager need the manager ID in the connection.',
  required: true,
  auth: googleAdsAuth,
  refreshers: [],
  options: async ({ auth }) => customerOptions(auth),
});

function formatCustomerId(id: string): string {
  return id.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
}

function labelFor(info: CustomerInfo): string {
  const flags = [info.manager ? 'manager' : '', info.testAccount ? 'test' : ''].filter(Boolean).join(', ');
  const name = info.descriptiveName ? `${info.descriptiveName}${flags ? ` (${flags})` : ''} · ` : '';
  return `${name}${formatCustomerId(info.id)}`;
}

const MAX_LABEL_LOOKUPS = 25;
