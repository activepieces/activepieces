import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';

export interface DubLink {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  qrCode: string;
  clicks: number;
  leads: number;
  sales: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
  archived: boolean;
}

export const createLink = createAction({
  name: 'create_link',
  displayName: 'Create Link',
  description: 'Create a new shortened link in your Dub workspace.',
  auth: dubAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'The full destination URL the short link should redirect to.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'The domain to use for the short link (e.g. `dub.sh`). If omitted, the primary workspace domain is used.',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'Short Link Slug',
      description:
        'Custom slug for the short link (e.g. `my-promo`). If omitted, a random 7-character slug is generated.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'Your internal database ID for this link. Must be unique per workspace. Useful for looking up the link later.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'A human-readable title for the link (used in the Dub dashboard).',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A short description of what the link points to.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag Names',
      description: 'List of tag names to attach to this link.',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description:
        'ISO 8601 datetime when the link should expire (e.g. `2025-12-31T23:59:59Z`). Expired links redirect to the expiration URL.',
      required: false,
    }),
    expiredUrl: Property.ShortText({
      displayName: 'Expired URL',
      description: 'URL to redirect to after the link expires.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password-protect the link. Visitors must enter this password before being redirected.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Archive this link immediately after creation.',
      required: false,
      defaultValue: false,
    }),
    rewrite: Property.Checkbox({
      displayName: 'Cloaked URL (URL Rewriting)',
      description: 'Cloak the destination URL — visitors see the short link URL in the browser.',
      required: false,
      defaultValue: false,
    }),
    ios: Property.ShortText({
      displayName: 'iOS Redirect URL',
      description: 'Redirect iOS device visitors to this URL instead.',
      required: false,
    }),
    android: Property.ShortText({
      displayName: 'Android Redirect URL',
      description: 'Redirect Android device visitors to this URL instead.',
      required: false,
    }),
    geo: Property.Json({
      displayName: 'Geo Targeting',
      description:
        'Country-code to URL map for geo-based redirects, e.g. `{"US": "https://us.example.com", "GB": "https://uk.example.com"}`.',
      required: false,
    }),
    comments: Property.LongText({
      displayName: 'Comments',
      description: 'Internal notes about this link (not shown to visitors).',
      required: false,
    }),
    // UTM parameters
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      description: 'UTM source parameter (e.g. `newsletter`, `twitter`).',
      required: false,
    }),
    utmMedium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'UTM medium parameter (e.g. `email`, `social`).',
      required: false,
    }),
    utmCampaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'UTM campaign parameter (e.g. `spring-sale`).',
      required: false,
    }),
    utmTerm: Property.ShortText({
      displayName: 'UTM Term',
      description: 'UTM term parameter for paid search keywords.',
      required: false,
    }),
    utmContent: Property.ShortText({
      displayName: 'UTM Content',
      description: 'UTM content parameter for A/B testing.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build body, omitting undefined/null values
    const body: Record<string, unknown> = {
      url: propsValue.url,
    };

    if (propsValue.domain) body['domain'] = propsValue.domain;
    if (propsValue.key) body['key'] = propsValue.key;
    if (propsValue.externalId) body['externalId'] = propsValue.externalId;
    if (propsValue.title) body['title'] = propsValue.title;
    if (propsValue.description) body['description'] = propsValue.description;
    if (propsValue.tags && (propsValue.tags as string[]).length > 0) {
      body['tagNames'] = propsValue.tags;
    }
    if (propsValue.expiresAt) body['expiresAt'] = propsValue.expiresAt;
    if (propsValue.expiredUrl) body['expiredUrl'] = propsValue.expiredUrl;
    if (propsValue.password) body['password'] = propsValue.password;
    if (propsValue.archived) body['archived'] = propsValue.archived;
    if (propsValue.rewrite) body['rewrite'] = propsValue.rewrite;
    if (propsValue.ios) body['ios'] = propsValue.ios;
    if (propsValue.android) body['android'] = propsValue.android;
    if (propsValue.geo) body['geo'] = propsValue.geo;
    if (propsValue.comments) body['comments'] = propsValue.comments;
    if (propsValue.utmSource) body['utmSource'] = propsValue.utmSource;
    if (propsValue.utmMedium) body['utmMedium'] = propsValue.utmMedium;
    if (propsValue.utmCampaign) body['utmCampaign'] = propsValue.utmCampaign;
    if (propsValue.utmTerm) body['utmTerm'] = propsValue.utmTerm;
    if (propsValue.utmContent) body['utmContent'] = propsValue.utmContent;

    const response = await httpClient.sendRequest<DubLink>({
      method: HttpMethod.POST,
      url: `${DUB_API_BASE}/links`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
