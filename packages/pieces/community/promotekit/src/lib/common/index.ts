import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { promotekitAuth } from '../..';

const BASE_URL = 'https://www.promotekit.com/api/v1';

export async function promotekitApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

const MAX_PAGES = 100;

export async function promotekitPaginatedApiCall<T>({
  token,
  path,
  queryParams,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    const response = await promotekitApiCall<{
      data: T[];
      has_more: boolean;
    }>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...queryParams,
        page: String(page),
        limit: '100',
      },
    });
    results.push(...response.body.data);
    hasMore = response.body.has_more;
    page++;
  }

  return results;
}

function flattenAffiliate(
  affiliate: Record<string, unknown>
): Record<string, unknown> {
  const campaign = affiliate['campaign'] as Record<string, unknown> | null;
  const links = affiliate['links'] as Array<Record<string, string>> | null;
  const promoCodes = affiliate['promo_codes'] as Array<
    Record<string, string>
  > | null;

  return {
    id: affiliate['id'],
    email: affiliate['email'],
    first_name: affiliate['first_name'],
    last_name: affiliate['last_name'],
    payout_email: affiliate['payout_email'] ?? null,
    clicks: affiliate['clicks'] ?? 0,
    approved: affiliate['approved'] ?? false,
    banned: affiliate['banned'] ?? false,
    links: links
      ? links.map((l) => `${l['url']} (${l['code']})`).join(', ')
      : null,
    promo_codes: promoCodes
      ? promoCodes.map((p) => p['code']).join(', ')
      : null,
    campaign_id: campaign?.['id'] ?? null,
    campaign_name: campaign?.['name'] ?? null,
    campaign_commission_type: campaign?.['commission_type'] ?? null,
    campaign_commission_amount: campaign?.['commission_amount'] ?? null,
    created_at: affiliate['created_at'],
    updated_at: affiliate['updated_at'],
  };
}

function flattenReferral(
  referral: Record<string, unknown>
): Record<string, unknown> {
  const affiliate = referral['affiliate'] as Record<string, unknown> | null;

  return {
    id: referral['id'],
    email: referral['email'],
    subscription_status: referral['subscription_status'] ?? null,
    signup_date: referral['signup_date'] ?? null,
    stripe_customer_id: referral['stripe_customer_id'] ?? null,
    affiliate_id: affiliate?.['id'] ?? null,
    affiliate_email: affiliate?.['email'] ?? null,
    affiliate_first_name: affiliate?.['first_name'] ?? null,
    affiliate_last_name: affiliate?.['last_name'] ?? null,
    created_at: referral['created_at'],
  };
}

function flattenCommission(
  commission: Record<string, unknown>
): Record<string, unknown> {
  const affiliate = commission['affiliate'] as Record<string, unknown> | null;
  const referral = commission['referral'] as Record<string, unknown> | null;
  const payout = commission['payout'] as Record<string, unknown> | null;

  return {
    id: commission['id'],
    revenue_amount: commission['revenue_amount'] ?? null,
    currency: commission['currency'] ?? null,
    commission_amount: commission['commission_amount'] ?? null,
    payout_status: commission['payout_status'] ?? null,
    referral_date: commission['referral_date'] ?? null,
    stripe_payment_id: commission['stripe_payment_id'] ?? null,
    affiliate_id: affiliate?.['id'] ?? null,
    affiliate_email: affiliate?.['email'] ?? null,
    referral_id: referral?.['id'] ?? null,
    referral_email: referral?.['email'] ?? null,
    payout_id: payout?.['id'] ?? null,
    created_at: commission['created_at'],
    updated_at: commission['updated_at'],
  };
}

function flattenPayout(payout: Record<string, unknown>): Record<string, unknown> {
  const affiliate = payout['affiliate'] as Record<string, unknown> | null;

  return {
    id: payout['id'],
    amount: payout['amount'] ?? null,
    currency: payout['currency'] ?? null,
    status: payout['status'] ?? null,
    affiliate_id: affiliate?.['id'] ?? null,
    affiliate_email: affiliate?.['email'] ?? null,
    affiliate_first_name: affiliate?.['first_name'] ?? null,
    affiliate_last_name: affiliate?.['last_name'] ?? null,
    created_at: payout['created_at'],
    updated_at: payout['updated_at'] ?? null,
  };
}

export const promotekitCommon = {
  flattenAffiliate,
  flattenReferral,
  flattenCommission,
  flattenPayout,

  campaignDropdown: Property.Dropdown({
    auth: promotekitAuth,
    displayName: 'Campaign',
    description: 'Select the campaign for this affiliate.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      const campaigns = await promotekitPaginatedApiCall<{
        id: string;
        name: string;
      }>({
        token: auth.secret_text as string,
        path: '/campaigns',
      });
      return {
        disabled: false,
        options: campaigns.map((c) => ({
          label: c.name,
          value: c.id,
        })),
      };
    },
  }),

  affiliateDropdown: Property.Dropdown({
    auth: promotekitAuth,
    displayName: 'Affiliate',
    description: 'Select the affiliate.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      const affiliates = await promotekitPaginatedApiCall<{
        id: string;
        email: string;
        first_name: string;
        last_name: string;
      }>({
        token: auth.secret_text as string,
        path: '/affiliates',
      });
      return {
        disabled: false,
        options: affiliates.map((a) => ({
          label: `${a.first_name ?? ''} ${a.last_name ?? ''} (${a.email
            })`.trim(),
          value: a.id,
        })),
      };
    },
  }),
};
