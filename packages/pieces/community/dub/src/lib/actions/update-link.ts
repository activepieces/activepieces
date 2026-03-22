import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';
import type { DubLink } from './create-link';

export const updateLink = createAction({
  name: 'update_link',
  displayName: 'Update Link',
  description: 'Update an existing Dub link. Only the fields you fill in will be updated.',
  auth: dubAuth,
  props: {
    linkId: Property.ShortText({
      displayName: 'Link ID',
      description: 'The ID of the link to update (e.g. `clv3g2...`). Find this from the Create Link or List Links actions.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'New Destination URL',
      description: 'Update the destination URL the link redirects to.',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'New Slug',
      description: 'Update the short link slug (the part after the domain).',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Update the human-readable title.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Update the link description.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag Names',
      description: 'Replace the link\'s tags with this new list of tag names. Send an empty array to clear all tags.',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'ISO 8601 datetime when the link should expire. Set to empty to remove expiration.',
      required: false,
    }),
    expiredUrl: Property.ShortText({
      displayName: 'Expired URL',
      description: 'URL to redirect to after expiration.',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Archive or unarchive the link.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Update the password for this link. Leave blank to remove password protection.',
      required: false,
    }),
    rewrite: Property.Checkbox({
      displayName: 'Cloaked URL (URL Rewriting)',
      description: 'Toggle URL cloaking.',
      required: false,
    }),
    ios: Property.ShortText({
      displayName: 'iOS Redirect URL',
      description: 'Update the iOS-specific redirect URL.',
      required: false,
    }),
    android: Property.ShortText({
      displayName: 'Android Redirect URL',
      description: 'Update the Android-specific redirect URL.',
      required: false,
    }),
    comments: Property.LongText({
      displayName: 'Comments',
      description: 'Update internal notes for this link.',
      required: false,
    }),
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      description: 'Update the UTM source parameter.',
      required: false,
    }),
    utmMedium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'Update the UTM medium parameter.',
      required: false,
    }),
    utmCampaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'Update the UTM campaign parameter.',
      required: false,
    }),
    utmTerm: Property.ShortText({
      displayName: 'UTM Term',
      description: 'Update the UTM term parameter.',
      required: false,
    }),
    utmContent: Property.ShortText({
      displayName: 'UTM Content',
      description: 'Update the UTM content parameter.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { linkId, ...rest } = propsValue;

    const body: Record<string, unknown> = {};

    if (rest.url !== undefined && rest.url !== null && rest.url !== '') body['url'] = rest.url;
    if (rest.key !== undefined && rest.key !== null && rest.key !== '') body['key'] = rest.key;
    if (rest.title !== undefined && rest.title !== null) body['title'] = rest.title;
    if (rest.description !== undefined && rest.description !== null) body['description'] = rest.description;
    if (rest.tags !== undefined) body['tagNames'] = rest.tags;
    if (rest.expiresAt !== undefined && rest.expiresAt !== null) body['expiresAt'] = rest.expiresAt;
    if (rest.expiredUrl !== undefined && rest.expiredUrl !== null) body['expiredUrl'] = rest.expiredUrl;
    if (rest.archived !== undefined) body['archived'] = rest.archived;
    if (rest.password !== undefined && rest.password !== null) body['password'] = rest.password;
    if (rest.rewrite !== undefined) body['rewrite'] = rest.rewrite;
    if (rest.ios !== undefined && rest.ios !== null) body['ios'] = rest.ios;
    if (rest.android !== undefined && rest.android !== null) body['android'] = rest.android;
    if (rest.comments !== undefined && rest.comments !== null) body['comments'] = rest.comments;
    if (rest.utmSource !== undefined && rest.utmSource !== null) body['utmSource'] = rest.utmSource;
    if (rest.utmMedium !== undefined && rest.utmMedium !== null) body['utmMedium'] = rest.utmMedium;
    if (rest.utmCampaign !== undefined && rest.utmCampaign !== null) body['utmCampaign'] = rest.utmCampaign;
    if (rest.utmTerm !== undefined && rest.utmTerm !== null) body['utmTerm'] = rest.utmTerm;
    if (rest.utmContent !== undefined && rest.utmContent !== null) body['utmContent'] = rest.utmContent;

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided to update.');
    }

    const response = await httpClient.sendRequest<DubLink>({
      method: HttpMethod.PATCH,
      url: `${DUB_API_BASE}/links/${linkId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
