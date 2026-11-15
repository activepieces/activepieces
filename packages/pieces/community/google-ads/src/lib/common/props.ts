import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from './api';
import type { GoogleAdsAuthValue, GoogleAdsCustomerInfo } from './types';
import { googleAdsUtils } from './utils';

function customerId<R extends boolean>({
  required,
  displayName = 'Customer',
  description = 'Google Ads account to operate on. Accounts reached through a manager need the manager ID in the connection.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: googleAdsAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => await customerOptions({ auth }),
  });
}

function userList<R extends boolean>({
  required,
  displayName = 'Audience List',
  description = 'CRM-based audience list (Customer Match) the members go to.',
}: PropParams<R>) {
  return Property.Dropdown({
    auth: googleAdsAuth,
    displayName,
    description,
    required,
    refreshers: ['customerId'],
    options: async ({ auth, customerId }) => {
      if (!auth?.access_token) {
        return disabledOptions({ placeholder: 'Please select an existing or create a new connection.' });
      }
      if (typeof customerId !== 'string' || customerId === '') {
        return disabledOptions({ placeholder: 'Please select a customer.' });
      }
      try {
        const { results, truncated } = await googleAdsApi.listContactInfoUserLists({ auth, customerId });
        const options = results.map((row) => ({ label: row.userList?.name ?? '', value: row.userList?.resourceName ?? '' }));
        if (options.length === 0) {
          return disabledOptions({
            placeholder: 'No CRM-based audience list with upload key type CONTACT_INFO in this account. Create one first (Create Record, Audience list).',
          });
        }
        return {
          disabled: false,
          options,
          ...(truncated
            ? {
                placeholder: `Showing the first ${options.length} CRM-based contact info audience lists. If yours is not listed, enter its resource name (e.g. customers/1234567890/userLists/55) or numeric id as a custom value.`,
              }
            : {}),
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return disabledOptions({ placeholder: `An error occurred while listing the audience lists: ${detail.slice(0, 300)}` });
      }
    },
  });
}

function resourceType<R extends boolean>({
  required,
  displayName = 'Resource Type',
  description = 'Which kind of record: campaign, ad group, ad, keyword or audience list.',
}: PropParams<R>) {
  return Property.StaticDropdown<string, R>({
    displayName,
    description,
    required,
    options: { options: googleAdsUtils.resources.map((def) => ({ label: def.label, value: def.type })) },
  });
}

function validateOnly<R extends boolean>({
  required,
  displayName = 'Validate Only',
  description = 'Ask Google to validate the request without applying it. Nothing is created, changed or removed.',
}: PropParams<R>) {
  return Property.Checkbox({ displayName, description, required, defaultValue: false });
}

function identifier<R extends boolean>({
  required,
  displayName = 'Record ID or Resource Name',
  description = 'Numeric id for campaigns, ad groups and audience lists; `<adGroupId>~<adId>` for ads; `<adGroupId>~<criterionId>` for keywords. A full resource name (`customers/…/campaigns/…`) also works.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function members({
  required,
  displayName = 'Members',
  description = 'One entry per person. Fill any of: e-mail, phone (E.164, e.g. +5511999999999), or the full address set (first name, last name, country code, postal code). E-mail, phone, first name and last name are normalized and SHA-256 hashed before upload; country code and postal code are sent unhashed (trimmed, country code uppercased), as Google requires.',
}: PropParams<true>) {
  return Property.Array({
    displayName,
    description,
    required,
    properties: {
      email: Property.ShortText({ displayName: 'E-mail', required: false }),
      phone: Property.ShortText({ displayName: 'Phone', required: false }),
      firstName: Property.ShortText({ displayName: 'First Name', required: false }),
      lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
      countryCode: Property.ShortText({ displayName: 'Country Code', description: 'ISO 3166-1 alpha-2, e.g. BR', required: false }),
      postalCode: Property.ShortText({ displayName: 'Postal Code', required: false }),
    },
  });
}

function waitForCompletion<R extends boolean>({
  required,
  displayName = 'Wait for Processing',
  description = 'Poll the request status for up to ~2 minutes. Matching usually takes longer, so this is off by default: the output carries the request ids to check later.',
}: PropParams<R>) {
  return Property.Checkbox({ displayName, description, required, defaultValue: false });
}

async function customerOptions({ auth }: { auth: GoogleAdsAuthValue | undefined }): Promise<DropdownState<string>> {
  if (!auth?.access_token) {
    return disabledOptions({ placeholder: 'Please select an existing or create a new connection.' });
  }
  try {
    const loginCustomerId = auth.props?.loginCustomerId?.trim();
    if (loginCustomerId) {
      const { clients, truncated } = await googleAdsApi.listCustomerClients({ auth, managerId: googleAdsUtils.normalizeCustomerId(loginCustomerId) });
      if (clients.length === 0) {
        return disabledOptions({ placeholder: 'The manager account has no client accounts.' });
      }
      return {
        disabled: false,
        options: clients.map((c) => ({ label: labelFor(c), value: c.id })),
        ...(truncated
          ? { placeholder: `Showing the first ${clients.length} accounts under the manager. If yours is not listed, enter its customer ID (e.g. 123-456-7890) as a custom value.` }
          : {}),
      };
    }
    const ids = await googleAdsApi.listAccessibleCustomers({ auth });
    if (ids.length === 0) {
      return disabledOptions({ placeholder: 'This Google account has no accessible Google Ads customers.' });
    }
    const lookups = await Promise.allSettled(ids.slice(0, MAX_LABEL_LOOKUPS).map((id) => googleAdsApi.getCustomerInfo({ auth, customerId: id })));
    const options = ids
      .map((id, index) => {
        const lookup = lookups[index];
        return { label: labelFor(lookup?.status === 'fulfilled' ? lookup.value : { id }), value: id };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    return { disabled: false, options };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return disabledOptions({ placeholder: `An error occurred while listing the accessible Google Ads customers: ${detail.slice(0, 300)}` });
  }
}

function labelFor(info: GoogleAdsCustomerInfo): string {
  const flags = [
    info.manager ? 'manager' : '',
    info.testAccount ? 'test' : '',
    info.status && info.status !== 'ENABLED' ? info.status.toLowerCase() : '',
  ]
    .filter(Boolean)
    .join(', ');
  const name = info.descriptiveName ? `${info.descriptiveName}${flags ? ` (${flags})` : ''} · ` : '';
  return `${name}${googleAdsUtils.formatCustomerId(info.id)}`;
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const googleAdsProps = { customerId, userList, resourceType, validateOnly, identifier, members, waitForCompletion };

const MAX_LABEL_LOOKUPS = 25;

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
