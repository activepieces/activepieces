import { Property } from '@activepieces/pieces-framework';
import { spreadIfDefined } from '@activepieces/pieces-framework';

export type ConductorAddress = {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type BillingAddressPropsValue = {
  billingLine1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
};

/**
 * Shared "Billing Address" props + builder — identical between upsert-customer.ts and
 * upsert-vendor.ts (both resources use the same QuickBooks Desktop address shape).
 */
export const billingAddressProps = {
  billingLine1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
  billingCity: Property.ShortText({ displayName: 'City', required: false }),
  billingState: Property.ShortText({ displayName: 'State', required: false }),
  billingPostalCode: Property.ShortText({ displayName: 'Postal Code', required: false }),
  billingCountry: Property.ShortText({ displayName: 'Country', required: false }),
};

export const billingAddressPropertyGroup = {
  key: 'billing',
  display: 'section' as const,
  label: 'Billing Address',
  props: ['billingLine1', 'billingCity', 'billingState', 'billingPostalCode', 'billingCountry'],
};

export function buildBillingAddress(propsValue: BillingAddressPropsValue): ConductorAddress | undefined {
  const hasAnyField =
    propsValue.billingLine1 ||
    propsValue.billingCity ||
    propsValue.billingState ||
    propsValue.billingPostalCode ||
    propsValue.billingCountry;
  if (!hasAnyField) {
    return undefined;
  }
  return {
    ...spreadIfDefined('line1', propsValue.billingLine1),
    ...spreadIfDefined('city', propsValue.billingCity),
    ...spreadIfDefined('state', propsValue.billingState),
    ...spreadIfDefined('postalCode', propsValue.billingPostalCode),
    ...spreadIfDefined('country', propsValue.billingCountry),
  };
}
