import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { getShopOutputSchema } from '../../output-schemas/orders';

export const shopifyAiGetShop = createAction({
  auth: shopifyAuth,
  name: 'get_shop',
  classification: 'READ',
  displayName: 'Get Shop',
  description: 'Get the store name, domain, currency, timezone and plan.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the connected store: name, domains, shop currency and enabled presentment currencies, IANA timezone, weight unit and plan. Call it first when you need the currency for money fields or the timezone to build date filters for search_orders and other searches. Read-only.',
    idempotent: true,
  },
  outputSchema: getShopOutputSchema,
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shop: GqlShop;
    }>({
      auth,
      query: `query GetShop { shop { id name email contactEmail myshopifyDomain url primaryDomain { host url } currencyCode enabledPresentmentCurrencies ianaTimezone timezoneAbbreviation timezoneOffset weightUnit unitSystem taxesIncluded taxShipping createdAt plan { publicDisplayName partnerDevelopment shopifyPlus } shopAddress { city provinceCode countryCodeV2 zip } } }`,
    });
    const shop = data.shop;
    return {
      id: shop.id,
      name: shop.name ?? null,
      email: shop.email ?? null,
      contact_email: shop.contactEmail ?? null,
      myshopify_domain: shop.myshopifyDomain ?? null,
      url: shop.url ?? null,
      primary_domain_host: shop.primaryDomain?.host ?? null,
      primary_domain_url: shop.primaryDomain?.url ?? null,
      currency_code: shop.currencyCode ?? null,
      enabled_presentment_currencies: (shop.enabledPresentmentCurrencies ?? []).join(', '),
      iana_timezone: shop.ianaTimezone ?? null,
      timezone_abbreviation: shop.timezoneAbbreviation ?? null,
      timezone_offset: shop.timezoneOffset ?? null,
      weight_unit: shop.weightUnit ?? null,
      unit_system: shop.unitSystem ?? null,
      taxes_included: shop.taxesIncluded ?? null,
      tax_shipping: shop.taxShipping ?? null,
      plan_name: shop.plan?.publicDisplayName ?? null,
      plan_partner_development: shop.plan?.partnerDevelopment ?? null,
      plan_shopify_plus: shop.plan?.shopifyPlus ?? null,
      address_city: shop.shopAddress?.city ?? null,
      address_province_code: shop.shopAddress?.provinceCode ?? null,
      address_country_code: shop.shopAddress?.countryCodeV2 ?? null,
      address_zip: shop.shopAddress?.zip ?? null,
      created_at: shop.createdAt ?? null,
      redacted_fields: redactedFields,
    };
  },
});

type GqlShop = {
  id: string;
  name?: string | null;
  email?: string | null;
  contactEmail?: string | null;
  myshopifyDomain?: string | null;
  url?: string | null;
  primaryDomain?: { host?: string | null; url?: string | null } | null;
  currencyCode?: string | null;
  enabledPresentmentCurrencies?: string[] | null;
  ianaTimezone?: string | null;
  timezoneAbbreviation?: string | null;
  timezoneOffset?: string | null;
  weightUnit?: string | null;
  unitSystem?: string | null;
  taxesIncluded?: boolean | null;
  taxShipping?: boolean | null;
  createdAt?: string | null;
  plan?: {
    publicDisplayName?: string | null;
    partnerDevelopment?: boolean | null;
    shopifyPlus?: boolean | null;
  } | null;
  shopAddress?: {
    city?: string | null;
    provinceCode?: string | null;
    countryCodeV2?: string | null;
    zip?: string | null;
  } | null;
};
