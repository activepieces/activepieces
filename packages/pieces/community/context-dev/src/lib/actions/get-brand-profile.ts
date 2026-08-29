import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { contextDevAuth } from '../auth';
import { contextApiCall, flattenRecord } from '../common/client';

export const getBrandProfile = createAction({
  name: 'get_brand_profile',
  classification: 'READ',
  displayName: 'Get Brand Profile',
  description:
    'Retrieve a company profile with logos, colors, links, and business details.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve brand identity and company details using a domain, name, email, stock ticker, direct URL, or transaction descriptor. Use this when the workflow needs logos, colors, social profiles, descriptions, or business metadata for one company.',
    idempotent: true,
  },
  auth: contextDevAuth,
  props: {
    lookupType: Property.StaticDropdown({
      displayName: 'Lookup By',
      description: 'Choose the identifier available for the company.',
      required: true,
      defaultValue: 'domain',
      options: {
        options: [
          { label: 'Domain', value: 'domain' },
          { label: 'Company Name', value: 'name' },
          { label: 'Email Address', value: 'email' },
          { label: 'Stock Ticker', value: 'ticker' },
          { label: 'Direct URL', value: 'direct_url' },
          { label: 'Transaction Description', value: 'transaction' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Lookup Value',
      description:
        'Domain, company name, email, ticker, full URL, or transaction descriptor matching the selected lookup method.',
      required: true,
      placeholder: 'stripe.com',
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Optional two-letter country hint for company-name and transaction lookups.',
      required: false,
      placeholder: 'us',
      advanced: true,
    }),
    tickerExchange: Property.ShortText({
      displayName: 'Ticker Exchange',
      description:
        'Optional exchange code for ticker lookups, such as NASDAQ or NYSE.',
      required: false,
      placeholder: 'NASDAQ',
      advanced: true,
    }),
    maximumSpeed: Property.Checkbox({
      displayName: 'Maximum Speed',
      description:
        'Skip slower enrichment operations for a faster but less comprehensive profile.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
    maxAgeMs: Property.Number({
      displayName: 'Cache Maximum Age',
      description: 'Maximum cache age in milliseconds before a hard refresh.',
      required: false,
      defaultValue: 7776000000,
      min: 86400000,
      max: 31536000000,
      advanced: true,
    }),
    timeoutMs: Property.Number({
      displayName: 'Timeout',
      description: 'Maximum request duration in milliseconds.',
      required: false,
      defaultValue: 60000,
      min: 1000,
      max: 120000,
      advanced: true,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description:
        'Use flat fields for tables and mappings, or return the complete API response.',
      required: false,
      defaultValue: 'flat',
      advanced: true,
      options: {
        options: [
          { label: 'Flat Fields', value: 'flat' },
          { label: 'Raw API Response', value: 'raw' },
        ],
      },
    }),
  },
  async run(context) {
    const lookupType = context.propsValue.lookupType;
    const response = await contextApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/brand/retrieve',
      body: buildBrandRetrieveRequest({
        lookupType,
        value: context.propsValue.value,
        country: context.propsValue.country,
        tickerExchange: context.propsValue.tickerExchange,
        maximumSpeed: context.propsValue.maximumSpeed,
        maxAgeMs: context.propsValue.maxAgeMs,
        timeoutMs: context.propsValue.timeoutMs,
      }),
    });

    if (context.propsValue.outputFormat === 'raw') {
      return response;
    }

    return flattenRecord(response);
  },
});

export function buildBrandRetrieveRequest({
  lookupType,
  value,
  country,
  tickerExchange,
  maximumSpeed,
  maxAgeMs,
  timeoutMs,
}: BrandRetrieveRequestParams): Record<string, unknown> {
  const lookup = buildBrandLookup({
    lookupType,
    value,
    country,
    tickerExchange,
  });

  return {
    ...lookup,
    ...(lookupType === 'direct_url'
      ? {}
      : {
          maxSpeed: maximumSpeed,
          ...(lookupType === 'transaction' ? {} : { maxAgeMs }),
        }),
    timeoutMS: timeoutMs,
  };
}

function buildBrandLookup({
  lookupType,
  value,
  country,
  tickerExchange,
}: BrandLookupParams): Record<string, unknown> {
  switch (lookupType) {
    case 'name':
      return {
        type: 'by_name',
        name: value,
        ...(country ? { country_gl: country } : {}),
      };
    case 'email':
      return { type: 'by_email', email: value };
    case 'ticker':
      return {
        type: 'by_ticker',
        ticker: value,
        ...(tickerExchange ? { ticker_exchange: tickerExchange } : {}),
      };
    case 'direct_url':
      return { type: 'by_direct_url', direct_url: value };
    case 'transaction':
      return {
        type: 'by_transaction',
        transaction_info: value,
        ...(country ? { country_gl: country } : {}),
      };
    default:
      return { type: 'by_domain', domain: value };
  }
}

type BrandRetrieveRequestParams = BrandLookupParams & {
  maximumSpeed?: boolean;
  maxAgeMs?: number;
  timeoutMs?: number;
};

type BrandLookupParams = {
  lookupType: string;
  value: string;
  country?: string;
  tickerExchange?: string;
};
