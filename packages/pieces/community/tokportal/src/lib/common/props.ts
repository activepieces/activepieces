import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall, TokPortalListResponse, WEBHOOK_EVENTS } from './client';

type BundleSummary = {
  id: string;
  title?: string | null;
  bundle_type?: string;
  status?: string;
  platform?: string;
};

type AccountSummary = {
  id: string;
  username?: string;
  platform?: string;
  country?: string;
};

type CountryOption = {
  code: string;
  name: string;
};

type WebhookEventCatalog = {
  data?: { events?: { type: string; description?: string }[] };
};

export const PLATFORM_OPTIONS = [
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Instagram', value: 'instagram' },
];

export const BUNDLE_TYPE_OPTIONS = [
  { label: 'Account and Videos', value: 'account_and_videos' },
  { label: 'Account Only', value: 'account_only' },
  { label: 'Videos Only (existing account)', value: 'videos_only' },
];

export const BUNDLE_STATUS_OPTIONS = [
  'draft',
  'pending_setup',
  'published',
  'published_priority',
  'accepted',
  'completed',
  'cancelled',
  'archived',
].map((status) => ({ label: status, value: status }));

export const tokportalProps = {
  bundleId: (required = true) =>
    Property.Dropdown({
      displayName: 'Bundle',
      description: 'The bundle (mission). Pick it from the list or paste a bundle UUID.',
      auth: tokportalAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your TokPortal account first' };
        }
        const response = await tokportalApiCall<TokPortalListResponse<BundleSummary>>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/bundles',
          query: { per_page: 100 },
        });
        return {
          disabled: false,
          options: (response.data ?? []).map((bundle) => ({
            label: `${bundle.title || bundle.bundle_type || 'Bundle'} (${bundle.status ?? 'unknown'}) - ${bundle.id}`,
            value: bundle.id,
          })),
        };
      },
    }),
  accountId: (required = true) =>
    Property.Dropdown({
      displayName: 'Account',
      description: 'A delivered (saved) account. Pick it from the list or paste an account UUID.',
      auth: tokportalAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your TokPortal account first' };
        }
        const response = await tokportalApiCall<TokPortalListResponse<AccountSummary>>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/accounts',
          query: { per_page: 100 },
        });
        return {
          disabled: false,
          options: (response.data ?? []).map((account) => ({
            label: `@${account.username ?? 'unknown'} (${account.platform ?? 'unknown'}) - ${account.id}`,
            value: account.id,
          })),
        };
      },
    }),
  country: (required = true) =>
    Property.Dropdown({
      displayName: 'Country',
      description: 'Country of the account manager who will create the account (for example US).',
      auth: tokportalAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your TokPortal account first' };
        }
        const response = await tokportalApiCall<{ data: CountryOption[] }>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/countries',
        });
        return {
          disabled: false,
          options: (response.data ?? []).map((country) => ({
            label: `${country.name} (${country.code})`,
            value: country.code,
          })),
        };
      },
    }),
  platform: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Platform',
      description: 'Social platform of the account.',
      required,
      options: { options: PLATFORM_OPTIONS },
    }),
  bundleType: (required = true) =>
    Property.StaticDropdown({
      displayName: 'Bundle Type',
      description:
        'account_and_videos (new account + video slots), account_only (new account) or videos_only (video slots on an existing delivered account).',
      required,
      options: { options: BUNDLE_TYPE_OPTIONS },
    }),
  webhookEvents: (required = true) =>
    Property.MultiSelectDropdown({
      displayName: 'Events',
      description:
        'TokPortal event types to subscribe to, for example account.finalized, video.finalized or account.banned.',
      auth: tokportalAuth,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        const fallback = WEBHOOK_EVENTS.map((event) => ({ label: event, value: event }));
        if (!auth) {
          return { disabled: false, options: fallback };
        }
        try {
          const response = await tokportalApiCall<WebhookEventCatalog>({
            apiKey: auth.secret_text,
            method: HttpMethod.GET,
            resourceUri: '/webhooks/events',
          });
          const events = response.data?.events ?? [];
          if (events.length === 0) {
            return { disabled: false, options: fallback };
          }
          return {
            disabled: false,
            options: events.map((event) => ({
              label: event.description ? `${event.type} - ${event.description}` : event.type,
              value: event.type,
            })),
          };
        } catch {
          return { disabled: false, options: fallback };
        }
      },
    }),
  maxResults: () =>
    Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of items to return. Leave empty to return every page.',
      required: false,
    }),
};
